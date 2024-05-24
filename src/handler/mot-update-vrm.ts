import { SQSEvent, SQSRecord } from 'aws-lambda';
import { SNSMessageBody } from '../models/updateVrm';
import { processRecord } from '../processors/processCherishedTransfer';
import { publish } from '../services/sns';
import logger from '../util/logger';

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
