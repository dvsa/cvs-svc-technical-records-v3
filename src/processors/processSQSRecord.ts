import { unmarshall } from '@aws-sdk/util-dynamodb';
import { SQSRecord } from 'aws-lambda';
import { TestResultSQSRecord } from '../models/testResult';

export const processRecord = (record: SQSRecord) => {
  const recordBody = JSON.parse(record.body ?? '') as TestResultSQSRecord;
  if (
    recordBody.eventName === 'INSERT'
    && recordBody.dynamodb
    && recordBody.dynamodb.NewImage
  ) {
    return unmarshall(recordBody.dynamodb.NewImage);
  }
  return undefined;
};
