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
import { checkStatusCodeValidity, validateUpdateErrors } from '../validators/update';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Update end point called');

  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.MISSING_AUTH_HEADER }),
    };
  }

  const updateErrors = validateUpdateErrors(event);
  if (updateErrors) {
    return addHttpHeaders(updateErrors);
  }
  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);

  const recordFromDB = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as TechrecordGet;

  const putBody = JSON.parse(event.body ?? '') as TechrecordPut;

  const formattedRecordFromDB = formatTechRecord(recordFromDB);

  const statusErrors = checkStatusCodeValidity(recordFromDB.techRecord_statusCode, putBody.techRecord_statusCode);
  if (statusErrors) {
    return addHttpHeaders(statusErrors);
  }

  const newRecord = { ...formattedRecordFromDB, ...putBody } as TechrecordGet;
  newRecord.techRecord_recordCompleteness = validateAndComputeRecordCompleteness(newRecord as TechrecordPut);

  const flattenedNewRecord = await flattenArrays(newRecord) as TechrecordGet;

  const updateType = getUpdateType(flattenedNewRecord, recordFromDB);
  recordFromDB.techRecord_updateType = updateType;

  const userDetails = getUserDetails(event.headers.Authorization);
  const date = new Date().toISOString();
  const updatedRecordFromDB = setLastUpdatedAuditDetails(recordFromDB, userDetails.username, userDetails.msOid, date);
  const updatedNewRecord = setCreatedAuditDetails(flattenedNewRecord, userDetails.username, userDetails.msOid, date);

  try {
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
    logger.error(error);
    return addHttpHeaders({
      statusCode: 400,
      body: error as string,
    });
  }
};
