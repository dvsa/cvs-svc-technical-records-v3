import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import logger from '../util/logger';

const sqsClient = new SQSClient({ region: process.env.DYNAMO_AWS_REGION });

export const addToSqs = async (messageBody: any, queueUrl: string) => {
  if (process.env.AWS_SAM_LOCAL) {
    return '123';
  }
  const params = {
    MessageBody: JSON.stringify(messageBody),
    QueueUrl: queueUrl,
  };

  try {
    await sqsClient.send(new SendMessageCommand(params));
    return undefined;
  } catch (err: unknown) {
    logger.error(err);
    throw new Error(err as string);
  }
};