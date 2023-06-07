import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import { getGetErrors } from '../validators/get';
import { getBySystemNumberAndCreatedTimestamp } from '../services/database';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Get end point called');

  const getErrors = getGetErrors(event);
  if (getErrors) {
    return addHttpHeaders(getErrors);
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber ?? '');
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp ?? '');
  logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

  // TODO: make this a proper type when we have it
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

  // TODO: reformat the record and add things back into arrays

  logger.debug(`result is: ${JSON.stringify(record)}`);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (!record || Object.keys(record).length === 0) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching sysNum ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify(record),
  };
};
