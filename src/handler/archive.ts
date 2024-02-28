import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ArchiveRecordRequestBody } from '../models/archive';
import { updateNotes } from '../processors/processArchiveRequest';
import { setLastUpdatedAuditDetails } from '../services/audit';
import { archiveRecord, getBySystemNumberAndCreatedTimestamp } from '../services/database';
import { getUserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateArchiveErrors } from '../validators/archive';

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

    const record: TechRecordType<'get'> = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

    logger.debug(`result is: ${JSON.stringify(record)}`);

    if (!record || !Object.keys(record).length) {
      return addHttpHeaders({
        statusCode: 404,
        body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
      });
    }

    if (record.techRecord_statusCode === StatusCode.ARCHIVED) {
      return addHttpHeaders({
        statusCode: 400,
        body: 'Cannot archive an archived record',
      });
    }

    const updatedRecord = setLastUpdatedAuditDetails(record, userDetails.username, userDetails.msOid, new Date().toISOString(), StatusCode.ARCHIVED);

    updateNotes(body.reasonForArchiving, updatedRecord, record);

    await archiveRecord(updatedRecord);

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(updatedRecord)),
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
