/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import 'dotenv/config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { schemas } from '@dvsa/cvs-type-definitions/schemas';
import { isValidObject } from '@dvsa/cvs-type-definitions/src/schema-validation/schema-validator';
import { postTechRecord } from '../services/database';
import logger from '../util/logger';
import { processRequest } from '../util/processRequest';
import { identifyObjectType } from '../validators/post';

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
    const body = JSON.parse(event.body);
    const schema: typeof schemas[number] = identifyObjectType(body, 'put')[0];
    console.log(schema);
    const res = isValidObject(schema, body);
    console.log(res);
    if (!res) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Technical Record' }),
      };
    }
    const requestBody: any = await processRequest(body);
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
