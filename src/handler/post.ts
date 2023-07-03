import 'dotenv/config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { postTechRecord } from '../services/database';
import logger from '../util/logger';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<{ body: unknown; statusCode: number }> => {
  logger.info('Post end point called');
  try {
    if (event.body === null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body is not a valid TechRecord' }),
      };
    }
    // TODO to use proper type when we have them
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const requestBody: any = JSON.parse(event.body);
    await postTechRecord(requestBody);
    logger.info('put item command sent');
    return {
      statusCode: 200,
      body: JSON.stringify(requestBody),
    };
  } catch
  (error) {
    logger.error(`Error has been thrown with ${JSON.stringify(error)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add record to DynamoDB' }),
    };
  }
};
