import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSRequestBody } from '../models/sqsPayload';
import logger from '../util/logger';
import { MotSQSRequestBody } from '../models/motSqsPayload';

const sqsClient = new SQSClient({ region: process.env.DYNAMO_AWS_REGION });

export const addToSqs = async (messageBody: SQSRequestBody | MotSQSRequestBody, queueUrl: string) => {
  if (process.env.AWS_SAM_LOCAL) {
    return '123';
  }
  const params = {
    MessageBody: JSON.stringify(messageBody),
    QueueUrl: queueUrl,
  };

  try {
    await sqsClient.send(new SendMessageCommand(params) as any);
    return undefined;
  } catch (err: unknown) {
    logger.error(err);
    throw new Error(err as string);
  }
};
