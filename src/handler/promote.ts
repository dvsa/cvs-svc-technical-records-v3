import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import 'dotenv/config';
import { cloneDeep } from 'lodash';
import { StatusCode } from '../models/StatusCode.enum';
import { TechRecordGet } from '../models/post';
import { PromoteRecordRequestBody } from '../models/promote';
import { SearchCriteria } from '../models/search';
import { archiveOldCreateCurrentRecord, getBySystemNumberAndCreatedTimestamp, searchByCriteria } from '../services/database';
import { getUserDetails } from '../services/user';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validatePromoteErrors } from '../validators/promote';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Promote end point called');

  const promoteErrors = validatePromoteErrors(event);

  if (promoteErrors) {
    return addHttpHeaders(promoteErrors);
  }

  const systemNumber = decodeURIComponent(event?.pathParameters?.systemNumber ?? '');
  const createdTimestamp = decodeURIComponent(event?.pathParameters?.createdTimestamp ?? '');
  const userDetails = getUserDetails(event.headers.Authorization ?? '');
  const { reasonForPromoting } = JSON.parse(event.body as string) as PromoteRecordRequestBody;

  logger.info(`Get from database with systemNumber ${systemNumber} and timestamp ${createdTimestamp}`);

  const provisionalRecord: TechRecordGet = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as TechRecordGet;

  logger.debug(`result is: ${JSON.stringify(provisionalRecord)}`);

  if (!provisionalRecord || !Object.keys(provisionalRecord).length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  if (provisionalRecord.techRecord_statusCode !== StatusCode.PROVISIONAL) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Record provided is not a provisional record so cannot be promoted.',
    });
  }

  const allVehicleRecords = await searchByCriteria(SearchCriteria.SYSTEM_NUMBER, provisionalRecord.systemNumber);
  const currentResult = allVehicleRecords.filter((searchResult) => searchResult.techRecord_statusCode === StatusCode.CURRENT);

  logger.debug(`Current result ${JSON.stringify(currentResult)}`);

  const recordsToArchive: TechRecordGet[] = [];

  if (currentResult.length > 0) {
    const currentRecord = await getBySystemNumberAndCreatedTimestamp(currentResult[0].systemNumber, currentResult[0].createdTimestamp) as TechRecordGet;
    currentRecord.techRecord_statusCode = StatusCode.ARCHIVED;
    currentRecord.techRecord_lastUpdatedAt = new Date().toISOString();
    currentRecord.techRecord_lastUpdatedByName = userDetails.username;
    currentRecord.techRecord_lastUpdatedById = userDetails.msOid;
    recordsToArchive.push(currentRecord);

    logger.debug(`Old current record after update ${JSON.stringify(currentRecord)}`);
  }

  const newCurrentRecord = cloneDeep(provisionalRecord);

  newCurrentRecord.techRecord_statusCode = StatusCode.CURRENT;
  newCurrentRecord.createdTimestamp = new Date().toISOString();
  delete newCurrentRecord.techRecord_lastUpdatedAt;
  newCurrentRecord.techRecord_createdByName = userDetails.username;
  newCurrentRecord.techRecord_createdById = userDetails.msOid;
  newCurrentRecord.techRecord_reasonForCreation = reasonForPromoting;

  logger.debug(`New current record after update ${JSON.stringify(newCurrentRecord)}`);

  provisionalRecord.techRecord_statusCode = StatusCode.ARCHIVED;
  provisionalRecord.techRecord_lastUpdatedAt = new Date().toISOString();
  provisionalRecord.techRecord_lastUpdatedByName = userDetails.username;
  provisionalRecord.techRecord_lastUpdatedById = userDetails.msOid;
  recordsToArchive.push(provisionalRecord);

  logger.debug(`Old provisional record after update ${JSON.stringify(provisionalRecord)}`);

  await archiveOldCreateCurrentRecord(recordsToArchive, newCurrentRecord);

  try {
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(newCurrentRecord),
    });
  } catch (error) {
    logger.error(`Error has been thrown with ${JSON.stringify(error)}`);
    return addHttpHeaders({
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to promote record: ${error}` }),
    });
  }
};
