import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { SQSEvent } from 'aws-lambda';
import { PlateReasonForIssue, Plates } from '../models/plate';
import { DocumentName, SQSRequestBody } from '../models/sqsPayload';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../services/database';
import { addToSqs } from '../services/sqs';
import { StatusCode } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import logger, { logError } from '../util/logger';
import { BatchPlateData } from '../models/batchPlate';

export const handler = async (event: SQSEvent): Promise<void> => {
  const batchIssuerName = 'CVS Batch Plate Generation';
  let numberOfRecordsUpdated = 0;
  let numberOfSqsAdded = 0;

  try {
    const processPromises = event.Records.map(async ({ body }) => {
      const data: BatchPlateData = JSON.parse(body) as BatchPlateData;
      const { systemNumber, createdTimestamp } = data;

      logger.info(`Processing record: sysNum ${systemNumber}, timestamp ${createdTimestamp}`);

      const dbRecord = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

      if (!dbRecord || !Object.keys(dbRecord).length) {
        throw new Error(`Missing record: sysNum ${systemNumber}, timestamp ${createdTimestamp}`);
      }

      validateRecord(dbRecord);

      const newPlate: Plates = createNewPlate(batchIssuerName);

      const formattedTechRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv' | 'trl'>>(dbRecord);

      if (isPlateAlreadyIssued(formattedTechRecord, batchIssuerName)) {
        logger.info(`Plate already issued for: sysNum ${systemNumber}, timestamp ${createdTimestamp}`);
        return;
      }

      updateRecordWithNewPlate(formattedTechRecord, newPlate);

      const flattenedTechRecord = flattenArrays(formattedTechRecord) as TechRecordType<'get'>;
      await inPlaceRecordUpdate(flattenedTechRecord);
      numberOfRecordsUpdated++;

      await sendToDocGenQueue(formattedTechRecord, newPlate);
      numberOfSqsAdded++;

      logger.info(`Successfully processed: sysNum ${systemNumber}, timestamp ${createdTimestamp}`);
    });

    await Promise.all(processPromises);

    logger.info(`Batch Plate: Updated ${numberOfRecordsUpdated} tech records and added ${numberOfSqsAdded} to SQS`);
  } catch (err: unknown) {
    logError('Error in batch processing', err);
    throw (err);
  }
};
/**
 * This function will validate the status code and the vehicle type on the technical record.
 * @param dbRecord
 */
const validateRecord = (dbRecord: TechRecordType<'get'>) => {
  if (dbRecord.techRecord_statusCode !== StatusCode.CURRENT) {
    throw new Error(`Non current record: statusCode ${dbRecord.techRecord_statusCode}`);
  }
  if (dbRecord.techRecord_vehicleType !== 'trl' && dbRecord.techRecord_vehicleType !== 'hgv') {
    throw new Error(`Invalid vehicle type: ${dbRecord.techRecord_vehicleType}`);
  }
};

/**
 * This function will create a new plate object.
 * @param batchIssuerName
 */
const createNewPlate = (batchIssuerName: string): Plates => ({
  plateSerialNumber: uuidv4(),
  plateIssueDate: new Date().toISOString(),
  plateReasonForIssue: PlateReasonForIssue.REPLACEMENT,
  plateIssuer: batchIssuerName,
});

/**
 * This function will check if a technical record already has a plate issued.
 * @param record
 * @param batchIssuerName
 */
const isPlateAlreadyIssued = <T extends TechRecordTypeByVehicle<'hgv' | 'trl'>>(
  record: T,
  batchIssuerName: string,
): boolean => record.techRecord_plates?.some((plate) => plate.plateIssuer === batchIssuerName) ?? false;

/**
 * This function will update the technical record with the new plate that has been generated.
 * @param record
 * @param newPlate
 */
const updateRecordWithNewPlate = (record: TechRecordTypeByVehicle<'hgv' | 'trl'>, newPlate: Plates) => {
  if (record.techRecord_plates) {
    record.techRecord_plates.push(newPlate);
  } else {
    record.techRecord_plates = [newPlate];
  }
};

/**
 * This function will send the processed record to the designated SQS queue.
 * @param techRecord
 * @param plate
 */
const sendToDocGenQueue = async (techRecord: TechRecordTypeByVehicle<'hgv' | 'trl'>, plate: Plates) => {
  const plateSqsPayload: SQSRequestBody = {
    techRecord,
    plate,
    documentName: DocumentName.MINISTRY,
    recipientEmailAddress: '',
  };
  logger.debug('Sending to Doc Gen Queue', JSON.stringify(plateSqsPayload));
  await addToSqs(plateSqsPayload, process.env.DOC_GEN_SQS_QUEUE ?? '');
};
