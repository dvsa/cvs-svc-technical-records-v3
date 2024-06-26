import {
  SQSClient, SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { SQSRequestBody } from '../models/sqsPayload';
import logger from '../util/logger';

const sqsClient = new SQSClient({ region: process.env.DYNAMO_AWS_REGION });

export const addToSqs = async (messageBody: SQSRequestBody, queueUrl: string) => {
  if (process.env.AWS_SAM_LOCAL) {
    return '123';
  }
  const params = {
    MessageBody: JSON.stringify(messageBody),
    QueueUrl: queueUrl,
  };

  try {
    const command = new SendMessageCommand(params);
    await sqsClient.send(command);
    return undefined;
  } catch (err: unknown) {
    logger.error(err);
    throw new Error(err as string);
  }
};
