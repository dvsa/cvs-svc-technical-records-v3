import 'dotenv/config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { postTechRecord } from '../services/database';
import logger from '../util/logger';
import { PostCar } from '../models/post';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<{ body: unknown; statusCode: number }> => {
  logger.info('Post end point called');
  try {
    // Parse the request body
    if (event.body === null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body is not a valid TechRecord' }),
      };
    }
    // TODO to use proper type when we have them.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const requestBody: PostCar = JSON.parse(event.body);

    if (!requestBody.vin || requestBody.vin.length > 21 || requestBody.vin.length < 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid body field 'vin'" }),
      };
    }
    if (!requestBody.msUserDetails || !requestBody.msUserDetails.msUser || !requestBody.msUserDetails.msOid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Microsoft user details not provided' }),
      };
    }
    await postTechRecord(requestBody);

    // Return a successful response
    return {
      statusCode: 200,
      body: JSON.stringify(requestBody),
    };
  } catch
  (error) {
    logger.error(error);
    // Return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add record to DynamoDB' }),
    };
  }
};
