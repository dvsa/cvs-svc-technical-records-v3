import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import logger from '../util/logger';
import { dynamoDBClientConfig } from '../config';

export enum NumberTypes {
  ZNumber = 'z-number',
  TrailerId = 'trailerId',
  TNumber = 't-number',
  SystemNumber = 'system-number',
}

const lambdaClient = new LambdaClient({ region: dynamoDBClientConfig.region });

export const generateNewNumber = async (numberType: NumberTypes): Promise<string> => {
  if (process.env.AWS_SAM_LOCAL) {
    return '123';
  }
  const input = {
    path: `/${numberType}`,
    httpMethod: 'POST',
    resource: `/${numberType}`,
  };
  const command = new InvokeCommand({
    FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(input),
  });
  try {
    const response = await lambdaClient.send(command);
    const bufferResponse = Buffer.from(response.Payload ?? '').toString('utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const bufferBody: string = await JSON.parse(bufferResponse).body;
    switch (numberType) {
      case NumberTypes.SystemNumber:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        return JSON.parse(bufferBody).systemNumber as string;
      case NumberTypes.TNumber:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        return JSON.parse(bufferBody).tNumber as string;
      case NumberTypes.TrailerId:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        return JSON.parse(bufferBody).trailerId as string;
      case NumberTypes.ZNumber:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        return JSON.parse(bufferBody).zNumber as string;
      default:
        throw new Error('Invalid search parameter');
    }
  } catch (e) {
    logger.error(`Error in generate ${numberType} ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};
