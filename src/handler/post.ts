import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import 'dotenv/config';
import { processPostRequest } from '../processors/processPostRequest';
import { postTechRecord } from '../services/database';
import { getUserDetails } from '../services/user';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validatePostErrors } from '../validators/post';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<{ body: unknown; statusCode: number }> => {
  logger.info('Post end point called');
  try {
    const postErrors = validatePostErrors(event);

    if (postErrors) {
      return addHttpHeaders(postErrors);
    }

    const userDetails = getUserDetails(event.headers.Authorization ?? '');
    const body = await JSON.parse(event.body ?? '') as TechRecordType<'put'>;

    const requestBody = await processPostRequest(body, userDetails);

    if (!requestBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid Technical Record' }),
      };
    }

    const postResponse = await postTechRecord(requestBody);

    return addHttpHeaders({
      statusCode: 201,
      body: JSON.stringify(formatTechRecord(postResponse)),
    });
  } catch (error) {
    logger.error(`Error has been thrown with ${JSON.stringify(error)}`);
    return addHttpHeaders({
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to add record to DynamoDB: ${error}` }),
    });
  }
};
