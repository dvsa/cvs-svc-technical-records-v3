import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import 'dotenv/config';
import { cloneDeep } from 'lodash';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { SearchCriteria } from '../models/search';
import { setCreatedAuditDetails } from '../services/audit';
import { getBySystemNumberAndCreatedTimestamp, postTechRecord, searchByCriteria } from '../services/database';
import { getUserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateUnarchiveErrors } from '../validators/unarchive';
import { UnarchiveRequestBody } from '../models/unarchive';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Unarchive end point called');

  try {
    const unarchiveErrors = validateUnarchiveErrors(event);

    if (unarchiveErrors) {
      return addHttpHeaders(unarchiveErrors);
    }

    const systemNumber = decodeURIComponent(event?.pathParameters?.systemNumber ?? '');
    const createdTimestamp = decodeURIComponent(event?.pathParameters?.createdTimestamp ?? '');
    const userDetails = getUserDetails(event.headers.Authorization ?? '');
    const { reasonForUnarchiving, status } = JSON.parse(event.body as string) as UnarchiveRequestBody;

    logger.info(`Get from database with systemNumber ${systemNumber} and timestamp ${createdTimestamp}`);

    const record: TechRecordType<'get'> = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);
    logger.debug(`result is: ${JSON.stringify(record)}`);

    if (!record || !Object.keys(record).length) {
      return addHttpHeaders({ statusCode: 404, body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}` });
    }

    if (record.techRecord_statusCode !== StatusCode.ARCHIVED) {
      return addHttpHeaders({ statusCode: 400, body: 'Record provided is not an archived record so cannot be unarchived.' });
    }

    const { primaryVrm } = (record as { primaryVrm?: string });
    const hasUnarchivedRecords = (await searchByCriteria(SearchCriteria.SYSTEM_NUMBER, record.systemNumber))
      .some((searchResult) => searchResult.techRecord_statusCode !== StatusCode.ARCHIVED && searchResult.primaryVrm === primaryVrm);

    if (hasUnarchivedRecords) {
      return addHttpHeaders({ statusCode: 400, body: 'Cannot archive a record with unarchived records' });
    }

    const recordToCreate: TechRecordType<'get'> = {
      ...cloneDeep(record),
      techRecord_reasonForCreation: reasonForUnarchiving,
    };

    setCreatedAuditDetails(recordToCreate, userDetails.username, userDetails?.msOid, new Date().toISOString(), status as StatusCode);

    const postResponse = await postTechRecord(recordToCreate);

    return addHttpHeaders({ statusCode: 200, body: JSON.stringify(formatTechRecord(postResponse)) });
  } catch (error) {
    //eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Error has been thrown with ${ JSON.stringify(error) }`);
    return addHttpHeaders({ statusCode: 500, body: JSON.stringify({ error: `Failed to unarchive record: ${error}` })});
  }
};
