/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import logger from '../util/logger';
import { dynamoDBClientConfig } from '../config';

export enum NumberTypes {
  ZNumber = 'z-number',
  TrailerId = 'trailerId',
  TNumber = 't-number',
  SystemNumber = 'systemNumber',
}

const apiResponseMap: Record<NumberTypes, string> = {
  [NumberTypes.ZNumber]: 'ZNumber',
  [NumberTypes.TrailerId]: 'trailerId',
  [NumberTypes.TNumber]: 'TNumber',
  [NumberTypes.SystemNumber]: 'systemNumber',
};

const lambdaClient = new LambdaClient({ region: dynamoDBClientConfig.region });

export const generateAndSendInvokeCommand = async (input: any) => {
  const command = new InvokeCommand({
    FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(input),
  });
  const response = await lambdaClient.send(command);
  const bufferResponse = Buffer.from(response.Payload!).toString('utf-8');
  return JSON.parse(bufferResponse).body;
};

export const generateNewNumber = async (numberType: NumberTypes): Promise<string> => {
  try {
    if (process.env.AWS_SAM_LOCAL) {
      return '123';
    }
    const input = {
      path: `/${numberType}/`,
      httpMethod: 'POST',
      resource: `/${numberType}/`,
    };
    const command = new InvokeCommand({
      FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(input),
    });
    const response = await lambdaClient.send(command);
    const bufferResponse = Buffer.from(response.Payload!).toString('utf-8');
    const bufferBody = JSON.parse(bufferResponse).body;
    const apiResponseValue = apiResponseMap[numberType];
    return JSON.parse(bufferBody)[apiResponseValue];
  } catch (e) {
    logger.error(`Error in generate ${numberType} ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};
