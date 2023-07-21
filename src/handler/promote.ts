import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import { TechRecordGet } from '../models/post';
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

  const systemNumber = event?.pathParameters?.systemNumber ?? '';
  const createdTimestamp = event?.pathParameters?.createdTimestamp ?? '';
  const userDetails = getUserDetails(event.headers.Authorization ?? '');

  logger.debug(`Get from database with systemNumber ${systemNumber} and timestamp ${createdTimestamp}`);

  const provisionalRecord: TechRecordGet = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as TechRecordGet;

  logger.debug(`result is: ${JSON.stringify(provisionalRecord)}`);

  if (!provisionalRecord || !Object.keys(provisionalRecord).length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  if (provisionalRecord.techRecord_statusCode !== 'provisional') {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Record provided is not a provisional record so cannot be promoted.',
    });
  }

  const allVehicleRecords = await searchByCriteria(SearchCriteria.SYSTEM_NUMBER, provisionalRecord.systemNumber);
  const currentResult = allVehicleRecords.filter((searchResult) => searchResult.techRecord_statusCode === 'current');

  logger.debug(`Current result ${JSON.stringify(currentResult)}`);

  let currentRecord: TechRecordGet | undefined;

  if (currentResult.length > 0) {
    currentRecord = await getBySystemNumberAndCreatedTimestamp(currentResult[0].systemNumber, currentResult[0].createdTimestamp) as TechRecordGet;
    currentRecord.techRecord_statusCode = 'archived';
    currentRecord.techRecord_lastUpdatedAt = new Date().toISOString();
    currentRecord.techRecord_lastUpdatedByName = userDetails.username;
    currentRecord.techRecord_lastUpdatedById = userDetails.msOid;

    logger.debug(`Old current record after update ${JSON.stringify(currentRecord)}`);
  }

  const newCurrentRecord = provisionalRecord;

  newCurrentRecord.techRecord_statusCode = 'current';
  newCurrentRecord.techRecord_lastUpdatedAt = new Date().toISOString();
  newCurrentRecord.techRecord_lastUpdatedByName = userDetails.username;
  newCurrentRecord.techRecord_lastUpdatedById = userDetails.msOid;

  logger.debug(`New current record after update ${JSON.stringify(newCurrentRecord)}`);

  provisionalRecord.techRecord_statusCode = 'archived';
  provisionalRecord.techRecord_lastUpdatedAt = new Date().toISOString();
  provisionalRecord.techRecord_lastUpdatedByName = userDetails.username;
  provisionalRecord.techRecord_lastUpdatedById = userDetails.msOid;

  logger.debug(`Old provisional record after update ${JSON.stringify(provisionalRecord)}`);

  await archiveOldCreateCurrentRecord(provisionalRecord, newCurrentRecord, currentRecord);

  try {
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(newCurrentRecord),
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
