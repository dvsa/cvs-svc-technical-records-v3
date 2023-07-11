/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import 'dotenv/config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { postTechRecord } from '../services/database';
import logger from '../util/logger';
import { processRequest } from '../util/processRequest';
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
    const body = JSON.parse(event.body);
    const requestBody: any = await processRequest(body, userDetails);
    if (!requestBody.techRecord_recordCompleteness) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Technical Record' }),
      };
    }
    const postResponse = await postTechRecord(requestBody);
    logger.info('put item command sent');
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
