import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import logger from '../util/logger';

const snsClient = new SNSClient({ region: process.env.DYNAMO_AWS_REGION });

export const publish = async (message: string, topicArn: string) => {
  logger.info('Sending SNS notification');

  if (process.env.AWS_SAM_LOCAL) {
    return '123';
  }
  const input = {
    TopicArn: topicArn,
    Message: message,
  };

  const command = new PublishCommand(input);
  try {
    const response = await snsClient.send(command);
    logger.debug(response);
    return undefined;
  } catch (err: unknown) {
    logger.error(err);
    throw new Error(err as string);
  }
};
