import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import { SearchCriteria } from '../models/search';
import { processUpdateRequest } from '../processors/processUpdateRequest';
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from '../services/database';
import { getUserDetails } from '../services/user';
import { ERRORS, StatusCode } from '../util/enum';
import { formatErrorMessage } from '../util/errorMessage';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateAgainstSkeletonSchema } from '../validators/post';
import { validateSysNumTimestampPathParams } from '../validators/sysNumTimestamp';
import { checkStatusCodeValidity, validateUpdateErrors } from '../validators/update';
import { checkVinValidity } from '../validators/vinValidity';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Update end point called');
  try {
    if (!event.headers.Authorization) {
      return addHttpHeaders({
        statusCode: 400,
        body: formatErrorMessage(ERRORS.MISSING_AUTH_HEADER),
      });
    }

    const isRequestInvalid = validateSysNumTimestampPathParams(event);
    if (isRequestInvalid) {
      return isRequestInvalid;
    }

    const isRequestBodyInvalid = validateUpdateErrors(event.body);
    if (isRequestBodyInvalid) {
      return addHttpHeaders(isRequestBodyInvalid);
    }

    const userDetails = getUserDetails(event.headers.Authorization);

    const systemNumber = decodeURIComponent(event.pathParameters?.systemNumber ?? '');
    const createdTimestamp = decodeURIComponent(event.pathParameters?.createdTimestamp ?? '');
    const requestBody = JSON.parse(event.body ?? '') as TechRecordType<'put'>;

    let recordFromDB = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);
    if (!recordFromDB || !Object.keys(recordFromDB).length) {
      return addHttpHeaders({
        statusCode: 404,
        body: formatErrorMessage(`No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`),
      });
    }

    const statusCodeErrors = checkStatusCodeValidity(recordFromDB.techRecord_statusCode, requestBody.techRecord_statusCode);
    if (statusCodeErrors) {
      return addHttpHeaders(statusCodeErrors);
    }

    const vinErrors = checkVinValidity(recordFromDB.vin, requestBody.vin);
    if (vinErrors) {
      return addHttpHeaders(vinErrors);
    }

    let archiveNeeded = true;
    if (recordFromDB.techRecord_statusCode === StatusCode.CURRENT && requestBody.techRecord_statusCode === StatusCode.PROVISIONAL) {
      const allRecords = await searchByCriteria(SearchCriteria.SYSTEM_NUMBER, recordFromDB.systemNumber);
      const provisionalRecord = allRecords.find((record) => record.techRecord_statusCode === StatusCode.PROVISIONAL);
      if (!provisionalRecord) {
        archiveNeeded = false;
      } else {
        recordFromDB = await getBySystemNumberAndCreatedTimestamp(provisionalRecord.systemNumber, provisionalRecord.createdTimestamp);
      }
    }

    const formattedRecordFromDB = formatTechRecord<typeof recordFromDB>(recordFromDB);
    const newRecord = { ...formattedRecordFromDB, ...requestBody } as TechRecordType<'put'>;
    const errors = validateAgainstSkeletonSchema(newRecord);

    if (errors) {
      return addHttpHeaders(errors);
    }

    const [updatedRecordFromDB, updatedNewRecord] = processUpdateRequest(recordFromDB, newRecord, userDetails);

    const recordsToArchive = archiveNeeded ? [updatedRecordFromDB] as TechRecordType<'get'>[] : [];

    await updateVehicle(recordsToArchive, [updatedNewRecord as TechRecordType<'get'>]);

    const formattedRecord = formatTechRecord(updatedNewRecord);

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formattedRecord),
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`${error}`);
    return addHttpHeaders({
      statusCode: 500,
      body: formatErrorMessage('Failed to update record'),
    });
  }
};
