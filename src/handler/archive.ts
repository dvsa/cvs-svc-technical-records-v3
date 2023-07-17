import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { validateArchiveErrors } from '../validators/archive';
import { addHttpHeaders } from '../util/httpHeaders';
import { archiveRecord, getBySystemNumberAndCreatedTimestamp } from '../services/database';
import { Status } from '../util/enums';
import { getUserDetails } from '../services/user';
import { formatTechRecord } from '../util/formatTechRecord';
import { ArchiveRecord } from '../models/archive';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Archive end point called');

    const archiveErrors = validateArchiveErrors(event);

    if(archiveErrors) {
        return addHttpHeaders(archiveErrors);
    }

    const body = await JSON.parse(event.body as string);

    if (!body.reasonForArchiving) {
        return {
          statusCode: 400,
          body: 'Reason for archiving not provided',
        };
    }

    const systemNumber = decodeURIComponent(event?.pathParameters?.systemNumber as string)
    const createdTimestamp = decodeURIComponent(event?.pathParameters?.createdTimestamp as string)
    const reasonForArchiving = body.reasonForArchiving;
    const userDetails = getUserDetails(event.headers.Authorization as string);

    logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

    const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as ArchiveRecord;

    logger.debug(`result is: ${JSON.stringify(record)}`);

    if (!record || !Object.keys(record).length) {
        return addHttpHeaders({
          statusCode: 400,
          body: `No record found matching sysNum ${systemNumber} and timestamp ${createdTimestamp}`,
        });
    }

    if(record.techRecord_statusCode === Status.ARCHIVED){
        return addHttpHeaders({
            statusCode: 400,
            body: 'Cannot archive an archived record'
          });
    }

    record.techRecord_statusCode = Status.ARCHIVED;
    record.techRecord_lastUpdatedAt = new Date().toISOString();
    record.techRecord_lastUpdatedByName = userDetails.username;
    record.techRecord_lastUpdatedById = userDetails.msOid;

    record.techRecord_notes = record.techRecord_notes ?
    record.techRecord_notes + `\n${reasonForArchiving}`
        : reasonForArchiving;

    await archiveRecord(record);

    return addHttpHeaders({
        statusCode: 200,
        body: JSON.stringify(formatTechRecord(record))
      });
}
