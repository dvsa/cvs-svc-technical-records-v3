import 'dotenv/config';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { EUVehicleCategory } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { processRecord } from '../processors/processSQSRecord';
import { syncTestResultInfo } from '../processors/processSyncTestResultInfo';
import { ERRORS } from '../util/enum';
import logger from '../util/logger';
import { TestResult, TestType } from '../models/testResult';

export const handler = async (event: SQSEvent) => {
  logger.info('sync-test-result-info lambda triggered');
  if (
    !event
      || !event.Records
      || !Array.isArray(event.Records)
      || !event.Records.length
  ) {
    throw new Error(ERRORS.EVENT_IS_EMPTY);
  }

  const promisesArray: Promise<object | undefined>[] = [];
  try {
    event.Records.forEach((record: SQSRecord) => {
      logger.debug('payload recieved from queue:', record);
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

    const results = await Promise.all(promisesArray);
    logger.info('resolved promises:', results);
    return results;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`an error occurred in the promises ${error}`);
    throw error;
  }
};
