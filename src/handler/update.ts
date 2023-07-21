import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { TechrecordGet, TechrecordPut } from '../models/post';
import { getUpdateType, setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../processors/processUpdateRequest';
import { getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { getUserDetails } from '../services/user';
import { ERRORS } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';
import { validateSysNumTimestampPathParams } from '../validators/sysNumTimestamp';
import { checkStatusCodeValidity, validateUpdateErrors } from '../validators/update';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Update end point called');
  try {
    if (!event.headers.Authorization) {
      return addHttpHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: ERRORS.MISSING_AUTH_HEADER }),
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

    const systemNumber = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
    const requestBody = JSON.parse(event.body ?? '') as TechrecordPut;

    const recordFromDB = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as TechrecordGet;
    if (!recordFromDB || !Object.keys(recordFromDB).length) {
      return addHttpHeaders({
        statusCode: 404,
        body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
      });
    }
    const statusCodeErrors = checkStatusCodeValidity(recordFromDB.techRecord_statusCode, requestBody.techRecord_statusCode);
    if (statusCodeErrors) {
      return addHttpHeaders(statusCodeErrors);
    }

    const formattedRecordFromDB = formatTechRecord(recordFromDB);

    const newRecord = { ...formattedRecordFromDB, ...requestBody } as TechrecordGet;
    newRecord.techRecord_recordCompleteness = validateAndComputeRecordCompleteness(newRecord as TechrecordPut);

    const flattenedNewRecord = await flattenArrays(newRecord) as TechrecordGet;

    const updateType = getUpdateType(flattenedNewRecord, recordFromDB);
    recordFromDB.techRecord_updateType = updateType;

    const date = new Date().toISOString();
    const updatedRecordFromDB = setLastUpdatedAuditDetails(recordFromDB, userDetails.username, userDetails.msOid, date);
    const updatedNewRecord = setCreatedAuditDetails(flattenedNewRecord, userDetails.username, userDetails.msOid, date);

    // logger.debug(updatedRecordFromDB);
    const record = await updateVehicle(updatedRecordFromDB, updatedNewRecord);
    logger.debug('updated details');
    // const formattedRecord = formatTechRecord(record);
    // logger.debug(`formatted record is: ${JSON.stringify(formattedRecord)}`);
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(record),
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`${error}`);
    return addHttpHeaders({
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to update record : ${error}` }),
    });
  }
};
