import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { ADRCertificateDetails } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { ADRCertificateTypes } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/adrCertificateTypes.enum';
import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { MotCherishedTransfer } from '../models/motCherishedTransfer';
import { SearchCriteria } from '../models/search';
import { SNSMessageBody } from '../models/updateVrm';
import { processCherishedTransfer } from '../processors/processCherishedTransfer';
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from '../services/database';
import { publish } from '../services/sns';
import { StatusCode } from '../util/enum';
import logger from '../util/logger';
import { DocumentName, SQSRequestBody } from '../models/sqsPayload';
import { validateAdrCertificateDetails } from '../validators/adrCertificate';
import { addHttpHeaders } from '../util/httpHeaders';
import { formatTechRecord } from '../util/formatTechRecord';
import { addToSqs } from '../services/sqs';

const SYSTEM_USER = 'CVS Automated Cherished Transfer';

export const handler = async (event: SQSEvent): Promise<void> => {
  logger.info('mot-update-vrm lambda triggered');

  try {
    const recordsToSend: SNSMessageBody[] = [];

    const processRecordWrapper = async (record: SQSRecord): Promise<void> => {
      const result = await processRecord(record);
      recordsToSend.push(...result);
    };

    await Promise.all(event.Records.map(processRecordWrapper));

    if (recordsToSend.length) {
      await publish(JSON.stringify(recordsToSend), process.env.VRM_TRANSFERRED_ARN ?? '');
    }

    logger.info('All records processed in SQS event');
  } catch (error) {
    logger.error(`An error occurred during processing mot update vrm: ${(error as Error).message}`);
    throw error;
  }
};

const processRecord = async (cherishedTransfer: SQSRecord): Promise<SNSMessageBody[]> => {
  const parsedRecord = JSON.parse(cherishedTransfer.body) as MotCherishedTransfer;
  const allRecords = await searchByCriteria(SearchCriteria.VIN, parsedRecord.vin);

  if (!allRecords.length) {
    logger.info(`No record found for VIN: ${parsedRecord.vin}`);
    return [];
  }

  const allCurrentRecords = allRecords.filter(({ techRecord_statusCode }) => techRecord_statusCode === StatusCode.CURRENT);

  if (!allCurrentRecords.length) {
    logger.info(`No current record found for VIN: ${parsedRecord.vin}`);
    return [];
  }

  if (allCurrentRecords.length > 1) {
    logger.info(`Duplicate current records found for VIN ${parsedRecord.vin}`);
    return [];
  }
  const currentRecord = allCurrentRecords[0];
  if (currentRecord.primaryVrm === parsedRecord.vrm) {
    logger.info(`No update needed for VRM ${parsedRecord.vrm} and VIN ${parsedRecord.vin}`);
    return [];
  }

  const completeTechRecord: TechRecordType<'get'> = await getBySystemNumberAndCreatedTimestamp(
    currentRecord.systemNumber,
    currentRecord.createdTimestamp,
  );

  const { recordsToArchive, recordsToUpdate } = processCherishedTransfer(
    {
      msOid: SYSTEM_USER,
      username: SYSTEM_USER,
      email: '',
    },
    parsedRecord.vrm,
    completeTechRecord,
  );
  await updateVehicle(recordsToArchive, recordsToUpdate);

  const newAdrCertificate = createAdrCertificate(currentRecord.systemNumber);
  const adrCertificateDetailsErrors = validateAdrCertificateDetails(newAdrCertificate);
  if (adrCertificateDetailsErrors) {
    addHttpHeaders(adrCertificateDetailsErrors);
    return [];
  }

  const formattedTechRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv' | 'trl' | 'lgv'>>(completeTechRecord);
  formattedTechRecord.techRecord_adrPassCertificateDetails = formattedTechRecord.techRecord_adrPassCertificateDetails
    ? [...formattedTechRecord.techRecord_adrPassCertificateDetails, newAdrCertificate]
    : [newAdrCertificate];

  const adrCertSqsPayload: SQSRequestBody = {
    techRecord: formattedTechRecord,
    adrCertificate: newAdrCertificate,
    documentName: DocumentName.ADR_PASS_CERTIFICATE,
    recipientEmailAddress: '',
  };

  await addToSqs(adrCertSqsPayload, process.env.DOC_GEN_SQS_QUEUE ?? '');
  return recordsToUpdate.map((record) => ({ ...record, userEmail: SYSTEM_USER }));
};

const createAdrCertificate = (systemNumber: string): ADRCertificateDetails => {
  const generatedTimestamp = new Date().toISOString();
  const certificateId = `adr_pass_${systemNumber}_${generatedTimestamp}`;

  return {
    createdByName: SYSTEM_USER,
    certificateType: 'PASS' as ADRCertificateTypes,
    generatedTimestamp,
    certificateId,
  };
};
