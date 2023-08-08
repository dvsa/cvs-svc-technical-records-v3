/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { SQSRecord } from 'aws-lambda';

export const processRecord = (record: SQSRecord) => {
  const recordBody = JSON.parse(record.body ?? '');
  if (
    recordBody.eventName === 'INSERT'
    && recordBody.dynamodb
    && recordBody.dynamodb.NewImage
  ) {
    return unmarshall(recordBody.dynamodb.NewImage);
  }
  return undefined;
};
