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

  try {
    const archiveErrors = validateArchiveErrors(event);

    if (archiveErrors) {
      return addHttpHeaders(archiveErrors);
    }

    const body: ArchiveRecordRequestBody = JSON.parse(event.body as string) as ArchiveRecordRequestBody;

    const systemNumber = event?.pathParameters?.systemNumber ?? '';
    const createdTimestamp = event?.pathParameters?.createdTimestamp ?? '';
    const userDetails = getUserDetails(event.headers.Authorization ?? '');

    logger.debug(`Get from database with systemNumber ${systemNumber} and timestamp ${createdTimestamp}`);

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
