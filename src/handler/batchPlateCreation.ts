import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { SQSEvent } from 'aws-lambda';
import { PlateReasonForIssue, Plates } from '../models/plate';
import { DocumentName, SQSRequestBody } from '../models/sqsPayload';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../services/database';
import { addToSqs } from '../services/sqs';
import { ERRORS, StatusCode } from '../util/enum';
import { formatErrorMessage } from '../util/errorMessage';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import logger from '../util/logger';
import { BatchPlateData } from '../models/batchPlate';

export const handler = async (event: SQSEvent): Promise<void> => {
  try {
    logger.info('Batch plate generation called');

    const batchIssuerName = 'CVS Batch Plate Generation';
    let numberOfRecordsUpdated = 0;
    let numberOfSqsAdded = 0;

    const processPromises = event.Records.map(async (sqsRecord) => {
      const { body } = sqsRecord;
      const data: BatchPlateData = JSON.parse(body) as BatchPlateData;
      const { systemNumber, createdTimestamp } = data;

      logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

      try {
        const dbRecord = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);
        logger.debug(`result is: ${JSON.stringify(dbRecord)}`);

        if (!dbRecord || !Object.keys(dbRecord).length) {
          logger.error(`Missing record with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);
          return;
        }
        if (dbRecord.techRecord_statusCode !== StatusCode.CURRENT) {
          logger.error(`Non current record with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);
          return;
        }
        if (dbRecord.techRecord_vehicleType !== 'trl' && dbRecord.techRecord_vehicleType !== 'hgv') {
          logger.error(`Non trl or hgv record with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);
          return;
        }

        const newPlate: Plates = {
          plateSerialNumber: uuidv4(),
          plateIssueDate: new Date().toISOString(),
          plateReasonForIssue: PlateReasonForIssue.REPLACEMENT,
          plateIssuer: batchIssuerName,
        };

        const arrayifiedRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv'> | TechRecordTypeByVehicle<'trl'>>(dbRecord);

        if (arrayifiedRecord.techRecord_plates) {
          if (arrayifiedRecord.techRecord_plates.some((plate) => plate.plateIssuer === batchIssuerName)) return;
          arrayifiedRecord.techRecord_plates.push(newPlate);
        } else {
          arrayifiedRecord.techRecord_plates = [newPlate];
        }

        const normalisedRecord = flattenArrays(arrayifiedRecord) as TechRecordType<'get'>;
        await inPlaceRecordUpdate(normalisedRecord);

        numberOfRecordsUpdated += 1;

        const plateSqsPayload: SQSRequestBody = {
          techRecord: arrayifiedRecord,
          plate: newPlate,
          documentName: DocumentName.MINISTRY,
          recipientEmailAddress: '',
        };
        logger.debug(JSON.stringify(plateSqsPayload));

        await addToSqs(plateSqsPayload, process.env.DOC_GEN_SQS_QUEUE ?? '');

        numberOfSqsAdded += 1;
      } catch (err: unknown) {
        logger.error(`${systemNumber}, ${createdTimestamp}, ${err as string}`);
      }
    });
    await Promise.all(processPromises);
    logger.info(`Batch Plate: Updated ${numberOfRecordsUpdated} tech records and added ${numberOfSqsAdded} to sqs`);
  } catch (err: unknown) {
    logger.error(err as string);
    logger.error(formatErrorMessage(ERRORS.FAILED_UPDATE_MESSAGE));
  }
};
