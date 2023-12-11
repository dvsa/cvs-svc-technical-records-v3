import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import logger from '../util/logger';

export const handler = (event: SQSEvent) => {
  logger.info('update-test-vrm lambda triggered');
  const response: SQSBatchResponse = {
    batchItemFailures: [],
  };
  return response;
};
