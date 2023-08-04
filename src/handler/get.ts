import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import { getBySystemNumberAndCreatedTimestamp } from '../services/database';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateSysNumTimestampPathParams } from '../validators/sysNumTimestamp';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Get end point called');

  const getErrors = validateSysNumTimestampPathParams(event);
  if (getErrors) {
    return addHttpHeaders(getErrors);
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

  const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

  logger.debug(`result is: ${JSON.stringify(record)}`);

  if (!record || !Object.keys(record).length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  const formattedRecord = formatTechRecord(record);

  logger.debug(`formatted record is: ${JSON.stringify(formattedRecord)}`);

  return addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify(formattedRecord),
  });
};
