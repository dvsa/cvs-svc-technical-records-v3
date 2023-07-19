import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { validateArchiveErrors } from '../validators/archive';
import { addHttpHeaders } from '../util/httpHeaders';
import { archiveRecord, getBySystemNumberAndCreatedTimestamp } from '../services/database';
import { getUserDetails } from '../services/user';
import { formatTechRecord } from '../util/formatTechRecord';
import { ArchiveRecord, ArchiveRecordRequestBody } from '../models/archive';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Archive end point called');

  const archiveErrors = validateArchiveErrors(event);

  if (archiveErrors) {
    return addHttpHeaders(archiveErrors);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body: ArchiveRecordRequestBody = JSON.parse(event.body as string);

    if (!body.reasonForArchiving) {
      return {
        statusCode: 400,
        body: 'Reason for archiving not provided',
      };
    }

    const systemNumber = event?.pathParameters?.systemNumber as string;
    const createdTimestamp = event?.pathParameters?.createdTimestamp as string;
    const userDetails = getUserDetails(event.headers.Authorization as string);

    logger.debug(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

    const record: ArchiveRecord = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as ArchiveRecord;

    logger.debug(`result is: ${JSON.stringify(record)}`);

    if (!record || !Object.keys(record).length) {
      return addHttpHeaders({
        statusCode: 404,
        body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
      });
    }

    if (record.techRecord_statusCode === 'archived') {
      return addHttpHeaders({
        statusCode: 400,
        body: 'Cannot archive an archived record',
      });
    }

    record.techRecord_statusCode = 'archived';
    record.techRecord_lastUpdatedAt = new Date().toISOString();
    record.techRecord_lastUpdatedByName = userDetails.username;
    record.techRecord_lastUpdatedById = userDetails.msOid;

    record.techRecord_notes = record.techRecord_notes
      ? `${record.techRecord_notes} \n${body.reasonForArchiving}`
      : body.reasonForArchiving;
    await archiveRecord(record);

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(record)),
    });
  } catch (error) {
    logger.error(`Error has been thrown with ${JSON.stringify(error)}`);
    return {
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to archive record: ${error}` }),
    };
  }
};
