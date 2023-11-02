import { EUVehicleCategory } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/euVehicleCategory.enum.js';
import { SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import 'dotenv/config';
import { TestResult, TestType } from '../models/testResult';
import { processRecord } from '../processors/processSQSRecord';
import { syncTestResultInfo } from '../processors/processSyncTestResultInfo';
import logger from '../util/logger';

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  logger.info('sync-test-result-info lambda triggered');

  const response: SQSBatchResponse = {
    batchItemFailures: [],
  };

  const promisesArray: Promise<object | undefined>[] = [];
  try {
    event.Records.forEach((record: SQSRecord) => {
      logger.debug('payload received from queue:', record);
      const test = processRecord(record) as TestResult;
      logger.debug('processed record:', test ?? 'no test');

      let promiseUpdateStatus: Promise<object | undefined> | undefined;

      if (test) {
        test.testTypes.forEach((testType: TestType) => {
          if (promiseUpdateStatus === undefined) {
            promiseUpdateStatus = syncTestResultInfo(
              test.systemNumber,
              test.testStatus,
              testType.testResult ?? '',
              testType.testTypeId,
              test.createdById,
              test.createdByName,
              test.euVehicleCategory as EUVehicleCategory || undefined,
            );
            promisesArray.push(promiseUpdateStatus);
          }
        });
      }
    });

    const results = await Promise.allSettled(promisesArray);

    results.forEach((r, i) => {
      if (r.status === 'rejected' || !r.value) {
        response.batchItemFailures.push({
          // eslint-disable-next-line security/detect-object-injection
          itemIdentifier: event.Records[i].messageId,
        });
      }
    });

    logger.info('resolved promises:', results);
    return response;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`an error occurred in the promises ${error}`);
    throw error;
  }
};
