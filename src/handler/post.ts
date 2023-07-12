/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import 'dotenv/config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { postTechRecord } from '../services/database';
import logger from '../util/logger';
import { processPostRequest } from '../processors/processPostRequest';
import { getUserDetails } from '../services/user';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<{ body: unknown; statusCode: number }> => {
  logger.info('Post end point called');

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body is not a valid TechRecord' }),
      };
    }
    if (!event.headers.Authorization) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: 'Missing authorization header' }),
      };
    }
    const userDetails = getUserDetails(event.headers.Authorization);
    const body = await JSON.parse(event.body);
    const requestBody = await processPostRequest(body, userDetails);
    if (!requestBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Technical Record' }),
      };
    }
    const postResponse = await postTechRecord(requestBody);
    return {
      statusCode: 200,
      body: JSON.stringify(postResponse),
    };
  } catch (error) {
    logger.error(`Error has been thrown with ${JSON.stringify(error)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add record to DynamoDB' }),
    };
  }
};
