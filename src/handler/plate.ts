import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import 'dotenv/config';
import { HGVAxles } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { PlateRequestBody, Plates } from '../models/plate';
import { DocumentName, SQSRequestBody } from '../models/sqsPayload';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../services/database';
import { addToSqs } from '../services/sqs';
import { NumberTypes, generateNewNumber } from '../services/testNumber';
import { StatusCode } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validatePlateErrors, validatePlateInfo } from '../validators/plate';
import {
  HgvOrTrl, trlRequiredFields, hgvRequiredFields, axleRequiredFields,
} from '../models/plateRequiredFields';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Plate end point called');

  const plateErrors = validatePlateErrors(event);
  if (plateErrors) {
    return addHttpHeaders(plateErrors);
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

  const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

  logger.debug(`result is: ${JSON.stringify(record)}`);

  if (!record || !Object.keys(record).length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  if (record.techRecord_statusCode !== StatusCode.CURRENT) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Tech record provided is not current',
    });
  }

  if (record.techRecord_vehicleType !== 'trl' && record.techRecord_vehicleType !== 'hgv') {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Tech record is not a HGV or TRL',
    });
  }

  const body = JSON.parse(event.body ?? '') as PlateRequestBody;

  const newPlate: Plates = {
    plateSerialNumber: await generateNewNumber(NumberTypes.PlateSerialNumber),
    plateIssueDate: new Date().toISOString(),
    plateReasonForIssue: body.reasonForCreation,
    plateIssuer: body.vtmUsername,
  };

  const plateInfoErrors = validatePlateInfo(newPlate);
  if (plateInfoErrors) {
    return addHttpHeaders(plateInfoErrors);
  }

  const arrayifiedRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv'> | TechRecordTypeByVehicle<'trl'>>(record);

  const validateVehicleFields = validateTechRecordPlates(arrayifiedRecord);
  if (validateVehicleFields) {
    return addHttpHeaders(validateVehicleFields);
  }

  if (arrayifiedRecord.techRecord_plates) {
    arrayifiedRecord.techRecord_plates.push(newPlate);
  } else {
    arrayifiedRecord.techRecord_plates = [newPlate];
  }

  const normalisedRecord = flattenArrays(arrayifiedRecord) as TechRecordType<'get'>;
  await inPlaceRecordUpdate(normalisedRecord);

  const plateSqsPayload: SQSRequestBody = {
    techRecord: arrayifiedRecord,
    plate: newPlate,
    documentName: DocumentName.MINISTRY,
    recipientEmailAddress: body.recipientEmailAddress,
  };

  logger.debug(JSON.stringify(plateSqsPayload));

  await addToSqs(plateSqsPayload, process.env.DOC_GEN_SQS_QUEUE ?? '');

  try {
    return addHttpHeaders({
      statusCode: 200,
      body: 'Plate generation successful',
    });
  } catch (err) {
    logger.error(`Error has been thrown with ${JSON.stringify(err)}`);
    return addHttpHeaders({ statusCode: 500, body: 'Error generating plate' });
  }
};

function validateTechRecordPlates(record: HgvOrTrl): APIGatewayProxyResult | undefined {
  const plateValidationTable = record.techRecord_vehicleType === 'trl' ? trlRequiredFields : hgvRequiredFields;

  if (cannotGeneratePlate(plateValidationTable, record)) {
    return {
      statusCode: 400,
      body: 'Tech record is missing mandatory fields for a plate',
    };
  }
  return undefined;
}

function cannotGeneratePlate(plateRequiredFields: string[], record: HgvOrTrl): boolean {

  const isOneFieldEmpty = plateRequiredFields.some(field => {
    const value = record[field as keyof HgvOrTrl];
    return value === undefined || value === null || value === '';
  });
  const areAxlesInvalid = record.techRecord_axles?.some(axle => axleRequiredFields.some(
    field => {
      const value = (axle as HGVAxles)[field as keyof HGVAxles];
      return value === undefined || value === null || value === '';
    }

  ));

  return isOneFieldEmpty || !record.techRecord_axles?.length || !!areAxlesInvalid;
}
