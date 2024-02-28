import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import { cloneDeep } from 'lodash';
import { PromoteRecordRequestBody } from '../models/promote';
import { SearchCriteria } from '../models/search';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from '../services/database';
import { getUserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validatePromoteErrors } from '../validators/promote';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Promote end point called');

  try {
    const promoteErrors = validatePromoteErrors(event);

    if (promoteErrors) {
      return addHttpHeaders(promoteErrors);
    }

    const systemNumber = decodeURIComponent(event?.pathParameters?.systemNumber ?? '');
    const createdTimestamp = decodeURIComponent(event?.pathParameters?.createdTimestamp ?? '');
    const userDetails = getUserDetails(event.headers.Authorization ?? '');
    const { reasonForPromoting } = JSON.parse(event.body as string) as PromoteRecordRequestBody;

    logger.info(`Get from database with systemNumber ${systemNumber} and timestamp ${createdTimestamp}`);

    const provisionalRecord = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

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
    const currentResult = allVehicleRecords.find((searchResult) => searchResult.techRecord_statusCode === StatusCode.CURRENT);

    logger.debug(`Current result ${JSON.stringify(currentResult)}`);

    const recordsToArchive = [];

    if (currentResult) {
      const currentRecord = await getBySystemNumberAndCreatedTimestamp(currentResult.systemNumber, currentResult.createdTimestamp);
      const currentNowArchived = setLastUpdatedAuditDetails(
        currentRecord,
        userDetails.username,
        userDetails.msOid,
        new Date().toISOString(),
        StatusCode.ARCHIVED,
      );
      recordsToArchive.push(currentNowArchived);
      logger.debug(`Old current record after update ${JSON.stringify(currentNowArchived)}`);
    }

    const provisionalNowArchived = setLastUpdatedAuditDetails(
      cloneDeep(provisionalRecord),
      userDetails.username,
      userDetails.msOid,
      new Date().toISOString(),
      StatusCode.ARCHIVED,
    );
    recordsToArchive.push(provisionalNowArchived);
    logger.debug(`Old provisional record after update ${JSON.stringify(provisionalNowArchived)}`);

    const newCurrent = setCreatedAuditDetails(
      provisionalRecord,
      userDetails.username,
      userDetails.msOid,
      new Date().toISOString(),
      StatusCode.CURRENT,
    );
    newCurrent.techRecord_reasonForCreation = reasonForPromoting;
    logger.debug(`New current record after update ${JSON.stringify(newCurrent)}`);

    await updateVehicle(recordsToArchive, [newCurrent]);

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(newCurrent)),
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
