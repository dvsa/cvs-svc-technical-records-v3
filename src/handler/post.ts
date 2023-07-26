import 'dotenv/config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { postTechRecord } from '../services/database';
import logger from '../util/logger';
import { processPostRequest } from '../processors/processPostRequest';
import { getUserDetails } from '../services/user';
import { TechrecordPut } from '../models/post';
import { ERRORS } from '../util/enum';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<{ body: unknown; statusCode: number }> => {
  logger.info('Post end point called');
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: ERRORS.MISSING_PAYLOAD }),
      };
    }
    if (!event.headers.Authorization) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: ERRORS.MISSING_AUTH_HEADER }),
      };
    }
    const userDetails = getUserDetails(event.headers.Authorization);
    const body = await JSON.parse(event.body) as TechrecordPut;
    if (!body.techRecord_vehicleType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: ERRORS.VEHICLE_TYPE_ERROR }),
      };
    }
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to add record to DynamoDB: ${error}` }),
    };
  }
};
