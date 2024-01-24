import { ADRCertificateTypes } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/adrCertificateTypes.enum.js';
import { ADRCertificateDetails } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import { AdrCertificateDetailsPayload } from '../models/adrCertificateDetails';
import { DocumentName, SQSRequestBody } from '../models/sqsPayload';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../services/database';
import { addToSqs } from '../services/sqs';
import { getUserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateAdrCertificate, validateAdrCertificateDetails } from '../validators/adrCertificate';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('ADR certificate end point called');

  try {
    const adrCertErrors = validateAdrCertificate(event);

    if (adrCertErrors) {
      return addHttpHeaders(adrCertErrors);
    }

    const systemNumber = decodeURIComponent(event?.pathParameters?.systemNumber ?? '');
    const createdTimestamp = decodeURIComponent(event?.pathParameters?.createdTimestamp ?? '');
    const userDetails = getUserDetails(event?.headers?.Authorization ?? '');

    logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

    const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

    logger.debug(`result is: ${JSON.stringify(record)}`);

    if (!record || !Object.keys(record).length) {
      return addHttpHeaders({
        statusCode: 404,
        body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
      });
    }

    if (record.techRecord_statusCode === StatusCode.ARCHIVED) {
      return addHttpHeaders({
        statusCode: 400,
        body: 'Tech record cannot be archived',
      });
    }

    if (record.techRecord_vehicleType !== 'trl' && record.techRecord_vehicleType !== 'hgv'
        && record.techRecord_vehicleType !== 'lgv') {
      return addHttpHeaders({
        statusCode: 400,
        body: 'Tech record is not a HGV or TRL or LGV',
      });
    }

    if (!record.techRecord_adrDetails_dangerousGoods) {
      return addHttpHeaders({
        statusCode: 400,
        body: 'Tech record does not allow dangerous goods',
      });
    }

    const body = JSON.parse(event.body ?? '') as AdrCertificateDetailsPayload;

    const generatedTimestamp = new Date().toISOString();
    const certificateId = `adr_pass_${systemNumber}_${generatedTimestamp}`;

    const newAdrCertificate: ADRCertificateDetails = {
      createdByName: userDetails.username,
      certificateType: body.certificateType as ADRCertificateTypes,
      generatedTimestamp,
      certificateId,
    };

    const adrCertificateDetailsErrors = validateAdrCertificateDetails(newAdrCertificate);
    if (adrCertificateDetailsErrors) {
      return addHttpHeaders(adrCertificateDetailsErrors);
    }

    const arrayifiedRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv' | 'trl' | 'lgv'>>(record);

    if (arrayifiedRecord.techRecord_adrPassCertificateDetails) {
      arrayifiedRecord.techRecord_adrPassCertificateDetails.push(newAdrCertificate);
    } else {
      arrayifiedRecord.techRecord_adrPassCertificateDetails = [newAdrCertificate];
    }

    const normalisedRecord = flattenArrays(arrayifiedRecord) as TechRecordType<'get'>;
    await inPlaceRecordUpdate(normalisedRecord);

    const adrCertSqsPayload: SQSRequestBody = {
      techRecord: arrayifiedRecord,
      adrCertificate: newAdrCertificate,
      documentName: DocumentName.ADR_PASS_CERTIFICATE,
      recipientEmailAddress: '',
    };

    logger.debug(JSON.stringify(adrCertSqsPayload));

    await addToSqs(adrCertSqsPayload, process.env.DOC_GEN_SQS_QUEUE ?? '');

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify('ADR certificate generation successful'),
    });
  } catch (e) {
    logger.error(`Error has been thrown with ${JSON.stringify(e)}`);
    return addHttpHeaders({ statusCode: 500, body: 'Error generating ADR certificate' });
  }
};
