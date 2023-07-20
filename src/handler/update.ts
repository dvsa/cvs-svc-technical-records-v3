import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import { getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { formatTechRecord, flattenArrays } from '../util/formatTechRecord';
import { checkStatusCodeValidity, validateUpdateErrors } from '../validators/update';
import { getUserDetails } from '../services/user';
import { TechrecordGet, TechrecordPut } from '../models/post';
import { computeRecordCompleteness } from '../processors/processPostRequest';
import { getUpdateType, setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../processors/processUpdateRequest';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Update end point called');

  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization header' }),
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
  // logger.debug(formattedRecordFromDB);
  // TODO: uncomment later
  // const statusErrors = checkStatusCodeValidity(recordFromDB.techRecord_statusCode, putBody.techRecord_statusCode);
  // if (statusErrors) {
  //   return addHttpHeaders(statusErrors);
  // }

  // techRecToArchive - not required
  // validateVrmWithHistory(); check if any current record has same vrm as the one being changed - not required
  // updateVehicleIdentifiers - not required
  // capitaliseGeneralVehicleAttributes - not required

  const newRecord = { ...formattedRecordFromDB, ...putBody } as TechrecordGet;
  const flattenedNewRecord = await flattenArrays(newRecord) as TechrecordGet;

  flattenedNewRecord.techRecord_recordCompleteness = computeRecordCompleteness(flattenedNewRecord as TechrecordPut);

  // TODO: uncomment
  // const updateType = getUpdateType(newRecord, recordFromDB);
  // recordFromDB.techRecord_updateType = updateType;

  const userDetails = getUserDetails(event.headers.Authorization);
  const date = new Date().toISOString();
  const updatedRecordFromDB = setLastUpdatedAuditDetails(recordFromDB, userDetails.username, userDetails.msOid, date);
  const updatedNewRecord = setCreatedAuditDetails(flattenedNewRecord, userDetails.username, userDetails.msOid, date);

  try {
    // logger.debug(flattenedNewRecord);
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
