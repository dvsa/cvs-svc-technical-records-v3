/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { SQSEvent } from 'aws-lambda';
import { MotCherishedTransfer } from '../models/motCherishedTransfer';
import { SearchCriteria } from '../models/search';
import { SNSMessageBody } from '../models/updateVrm';
import { processCherishedTransfer } from '../processors/processCherishedTransfer';
import { searchByCriteria, updateVehicle } from '../services/database';
import { publish } from '../services/sns';
import { StatusCode } from '../util/enum';
import logger from '../util/logger';

export const handler = async (event: SQSEvent) => {
  logger.info('mot-update-vrm lambda triggered');

  try {
    const recordsToSend: SNSMessageBody[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const cherishedTransfer of event.Records) {
      const parsedRecord: MotCherishedTransfer = JSON.parse(cherishedTransfer.body) as MotCherishedTransfer;
      const allRecords = await searchByCriteria(SearchCriteria.VIN, parsedRecord.vin);

      if (!allRecords.length) {
        logger.info(`No record found for VIN: ${parsedRecord.vin}`);
        continue;
      }

      const allCurrentRecords = allRecords.filter((x) => x.techRecord_statusCode === StatusCode.CURRENT);

      if (!allCurrentRecords.length) {
        logger.info(`No current record found for VIN: ${parsedRecord.vin}`);
        continue;
      }

      const matchingCurrentVrmRecords = allCurrentRecords.find((x) => x.primaryVrm === parsedRecord.vrm);

      if (allCurrentRecords.length > 1) {
        logger.info(`Duplicate current records found for VIN ${parsedRecord.vin}`);
      } else if (matchingCurrentVrmRecords) {
        logger.info(`No update needed for VRM ${parsedRecord.vrm} and VIN ${parsedRecord.vin}`);
      } else {
        const currentRecord = allCurrentRecords[0];
        const { recordsToArchive, recordsToUpdate } = processCherishedTransfer(
          {
            msOid: 'CVS Automated Cherished Transfer',
            username: 'CVS Automated Cherished Transfer',
            email: '',
          },
          parsedRecord.vrm,
          currentRecord as TechRecordType<'get'>,
        );

        await updateVehicle(recordsToArchive, recordsToUpdate);

        logger.info(`Updated systemNumber ${currentRecord.systemNumber} with VRM ${parsedRecord.vrm}`);

        recordsToUpdate.forEach((record) => recordsToSend.push({ ...record, userEmail: 'something@goes.here' }));
      }
    }

    if (recordsToSend.length) {
      await publish(JSON.stringify(recordsToSend), process.env.VRM_TRANSFERRED_ARN ?? '');
    }

    logger.info('All records processed in SQS event');
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`an error occurred during processing mot update vrm ${error}`);
    throw error;
  }
};
