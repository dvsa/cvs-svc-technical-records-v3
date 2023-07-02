/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import logger from '../util/logger';
import { dynamoDBClientConfig } from '../config';
import {APIGatewayProxyResult} from "aws-lambda";

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
    logger.info('test number response');
    logger.info(response);
    const bufferResponse = Buffer.from(response.Payload!).toString('utf-8');
    const bufferBody = await JSON.parse(bufferResponse).body;
    switch (numberType) {
      case NumberTypes.SystemNumber:
        return JSON.parse(bufferBody).systemNumber;
      case NumberTypes.TNumber:
        return JSON.parse(bufferBody).tNumber;
      case NumberTypes.TrailerId:
        return JSON.parse(bufferBody).trailerId;
      case NumberTypes.ZNumber:
        return JSON.parse(bufferBody).zNumber;
      default:
        throw new Error('Invalid search parameter');
    }
  } catch (e) {
    logger.error(`Error in generate ${numberType} ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};
