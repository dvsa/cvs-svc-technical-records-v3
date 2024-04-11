/* eslint-disable no-continue */
import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { PlateReasonForIssue, Plates } from '../../models/plate';
import { DocumentName, SQSRequestBody } from '../../models/sqsPayload';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../../services/database';
import { addToSqs } from '../../services/sqs';
import { ERRORS, StatusCode } from '../../util/enum';
import { formatErrorMessage } from '../../util/errorMessage';
import { flattenArrays, formatTechRecord } from '../../util/formatTechRecord';
import { addHttpHeaders } from '../../util/httpHeaders';
import logger from '../../util/logger';
import batchPlatesData from './resources/batchPlatesData.json';

export type BatchPlateData = {
  systemNumber: string,
  createdTimestamp: string
};

export const handler = async (batchPlateRecords: BatchPlateData[]) => {
  try {
    logger.info('Batch plate generation called');

    logger.info(`Payload in is ${JSON.stringify(batchPlateRecords)}`);

    const batchData = batchPlateRecords ?? batchPlatesData;

    const batchIssuerName = 'CVS Batch Plate Generation';
    let numberOfRecordsUpdated = 0;
    let numberOfSqsAdded = 0;

    // eslint-disable-next-line no-restricted-syntax
    for await (const data of batchData) {
      const { systemNumber, createdTimestamp } = data;
      logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

      try {
        const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);
        logger.debug(`result is: ${JSON.stringify(record)}`);

        if (!record || !Object.keys(record).length) {
          logger.error(`Missing record with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);
          continue;
        }
        if (record.techRecord_statusCode !== StatusCode.CURRENT) {
          logger.error(`Non current record with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);
          continue;
        }
        if (record.techRecord_vehicleType !== 'trl' && record.techRecord_vehicleType !== 'hgv') {
          logger.error(`Non trl or hgv record with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);
          continue;
        }

        const newPlate: Plates = {
          plateSerialNumber: uuidv4(),
          plateIssueDate: new Date().toISOString(),
          plateReasonForIssue: PlateReasonForIssue.REPLACEMENT,
          plateIssuer: batchIssuerName,
        };

        const arrayifiedRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv'> | TechRecordTypeByVehicle<'trl'>>(record);

        if (arrayifiedRecord.techRecord_plates) {
          if (arrayifiedRecord.techRecord_plates.some((plate) => plate.plateIssuer === batchIssuerName)) continue;
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
      } catch (err) {
        logger.error(`${systemNumber}, ${createdTimestamp}, ${JSON.stringify(err)}`);
      }
    }

    return addHttpHeaders({
      statusCode: 200,
      body: `Batch Plate: Updated ${numberOfRecordsUpdated} tech records and added ${numberOfSqsAdded} to sqs`,
    });
  } catch (e) {
    logger.error(e);
    return addHttpHeaders({
      statusCode: 500,
      body: formatErrorMessage(ERRORS.FAILED_UPDATE_MESSAGE),
    });
  }
};
