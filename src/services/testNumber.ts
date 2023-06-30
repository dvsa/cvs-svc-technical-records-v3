/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import logger from '../util/logger';
import { dynamoDBClientConfig } from '../config';

const lambdaClient = new LambdaClient({ region: dynamoDBClientConfig.region });

export const generateSystemNumber = async (): Promise<string> => {
  try {
    if (process.env.AWS_SAM_LOCAL) {
      return '123';
    }
    const input = {
      path: '/system-number/',
      httpMethod: 'POST',
      resource: '/system-number/',
    };

    const command = new InvokeCommand({
      FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(input),
    });

    const response = await lambdaClient.send(command);
    const bufferResponse = Buffer.from(response.Payload!).toString('utf-8');
    const bufferBody = JSON.parse(bufferResponse).body;
    return JSON.parse(bufferBody).systemNumber;
  } catch (e) {
    logger.error(`Error in generate system number ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};
export const generateTrailerId = async (): Promise<string> => {
  try {
    if (process.env.AWS_SAM_LOCAL) {
      return '123';
    }
    const input = {
      path: '/trailerId/',
      httpMethod: 'POST',
      resource: '/trailerId/',
    };

    const command = new InvokeCommand({
      FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(input),
    });

    const response = await lambdaClient.send(command);
    const bufferResponse = Buffer.from(response.Payload!).toString('utf-8');
    const bufferBody = JSON.parse(bufferResponse).body;
    return JSON.parse(bufferBody).systemNumber;
  } catch (e) {
    logger.error(`Error in generate system number ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};

export const generateZNumber = async (): Promise<string> => {
  try {
    if (process.env.AWS_SAM_LOCAL) {
      return '123';
    }
    const input = {
      path: '/z-number/',
      httpMethod: 'POST',
      resource: '/z-number/',
    };

    const command = new InvokeCommand({
      FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(input),
    });

    const response = await lambdaClient.send(command);
    const bufferResponse = Buffer.from(response.Payload!).toString('utf-8');
    const bufferBody = JSON.parse(bufferResponse).body;
    return JSON.parse(bufferBody).systemNumber;
  } catch (e) {
    logger.error(`Error in generate system number ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};

export const generateTNumber = async (): Promise<string> => {
  try {
    if (process.env.AWS_SAM_LOCAL) {
      return '123';
    }
    const input = {
      path: '/t-number/',
      httpMethod: 'POST',
      resource: '/t-number/',
    };

    const command = new InvokeCommand({
      FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(input),
    });

    const response = await lambdaClient.send(command);
    const bufferResponse = Buffer.from(response.Payload!).toString('utf-8');
    const bufferBody = JSON.parse(bufferResponse).body;
    return JSON.parse(bufferBody).systemNumber;
  } catch (e) {
    logger.error(`Error in generate system number ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};
