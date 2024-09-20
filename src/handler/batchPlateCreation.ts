import {
  TechRecordType as TechRecordTypeByVehicle,
} from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
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

      if (dbRecord.techRecord_statusCode !== StatusCode.CURRENT) {
        throw new Error(`Non current record: statusCode ${dbRecord.techRecord_statusCode}`);
      }
      if (dbRecord.techRecord_vehicleType !== 'trl' && dbRecord.techRecord_vehicleType !== 'hgv') {
        throw new Error(`Invalid vehicle type: ${dbRecord.techRecord_vehicleType}`);
      }

      const newPlate: Plates = {
        plateSerialNumber: uuidv4(),
        plateIssueDate: new Date().toISOString(),
        plateReasonForIssue: PlateReasonForIssue.REPLACEMENT,
        plateIssuer: batchIssuerName,
      };

      const formattedTechRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv' | 'trl'>>(dbRecord);

      if (formattedTechRecord.techRecord_plates?.some((plate) => plate.plateIssuer === batchIssuerName) ?? false) {
        logger.info(`Plate already issued for: sysNum ${systemNumber}, timestamp ${createdTimestamp}`);
        return;
      }

      if (formattedTechRecord.techRecord_plates) {
        formattedTechRecord.techRecord_plates.push(newPlate);
      } else {
        formattedTechRecord.techRecord_plates = [newPlate];
      }
      const flattenedTechRecord = flattenArrays(formattedTechRecord) as TechRecordType<'get'>;
      await inPlaceRecordUpdate(flattenedTechRecord);
      numberOfRecordsUpdated++;

      const plateSqsPayload: SQSRequestBody = {
        techRecord: formattedTechRecord,
        plate: newPlate,
        documentName: DocumentName.MINISTRY,
        recipientEmailAddress: '',
      };
      logger.debug('Sending to Doc Gen Queue', JSON.stringify(plateSqsPayload));
      await addToSqs(plateSqsPayload, process.env.DOC_GEN_SQS_QUEUE ?? '');

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
