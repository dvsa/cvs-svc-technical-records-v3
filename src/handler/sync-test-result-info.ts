import { EUVehicleCategory } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/euVehicleCategory.enum.js';
import { SQSBatchResponse, SQSEvent } from 'aws-lambda';
import 'dotenv/config';
import { TestResult } from '../models/testResult';
import { processRecord } from '../processors/processSQSRecord';
import { syncTestResultInfo } from '../processors/processSyncTestResultInfo';
import logger from '../util/logger';

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  logger.info('sync-test-result-info lambda triggered');

  const response: SQSBatchResponse = {
    batchItemFailures: [],
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const record of event.Records) {
    try {
      logger.debug('payload received from queue:', record);
      const test = processRecord(record) as TestResult;
      logger.debug('processed record:', test ?? 'no test');

      if (test) {
        // eslint-disable-next-line no-restricted-syntax
        for (const testType of test.testTypes) {
          // eslint-disable-next-line no-await-in-loop
          await syncTestResultInfo(
            test.systemNumber,
            test.testStatus,
            testType.testResult ?? '',
            testType.testTypeId,
            test.createdById,
            test.createdByName,
            test.euVehicleCategory as EUVehicleCategory || undefined,
          );
        }
      }
    } catch (error) {
      logger.error(`an error occurred while processing record ${record.messageId}: ${error instanceof Error
        ? error.message
        : JSON.stringify(error)}`);
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return response;
};
