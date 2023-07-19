import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import { getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { formatTechRecord } from '../util/formatTechRecord';
import { checkStatusCodeValidity, validateUpdateErrors } from '../validators/update';
import { getUserDetails } from '../services/user';
import { TechrecordGet, TechrecordPut } from '../models/post';
import { computeRecordCompleteness, flattenArrays } from '../processors/processPostRequest';
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

  const oldRecord = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as TechrecordGet;
  // logger.debug(oldRecord);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const putBody = JSON.parse(event.body!).techRecord as TechrecordPut;

  // const flattenPutBody = await flattenArrays(putBody);
  const formattedOldRecord: any = formatTechRecord(oldRecord);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  // logger.debug(formattedOldRecord);
  const statusErrors = checkStatusCodeValidity(oldRecord.techRecord_statusCode, putBody.techRecord_statusCode);
  if (statusErrors) {
    return addHttpHeaders(statusErrors);
  }

  // techRecToArchive - not required
  // validateVrmWithHistory(); check if any current record has same vrm as the one being changed - not required
  // updateVehicleIdentifiers - not required
  // capitaliseGeneralVehicleAttributes - not required

  const newRecord = { ...formattedOldRecord, ...putBody } as TechrecordGet;
  // logger.debug(newRecord);
  newRecord.techRecord_recordCompleteness = computeRecordCompleteness(newRecord as TechrecordPut);

  // TODO: is updateType required???
  // const updateType = getUpdateType(newRecord, oldRecord);
  // oldRecord.techRecord_updateType = updateType;

  logger.debug('updating details');
  const userDetails = getUserDetails(event.headers.Authorization);
  const date = new Date().toISOString();
  const updatedOldRecord = setLastUpdatedAuditDetails(oldRecord, userDetails.username, userDetails.msOid, date);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const updatedNewRecord1 = JSON.parse(JSON.stringify(setCreatedAuditDetails(newRecord, userDetails.username, userDetails.msOid, date)));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const updatedNewRecord = await flattenArrays(updatedNewRecord1) as TechrecordPut;
  logger.debug(updatedNewRecord1);
  try {
    const record = await updateVehicle(updatedOldRecord, updatedNewRecord);
    logger.debug('updated details');
    const formattedRecord = formatTechRecord(record);
    // logger.debug(`formatted record is: ${JSON.stringify(formattedRecord)}`);
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formattedRecord),
    });
  } catch (error) {
    logger.error(error);
    return addHttpHeaders({
      statusCode: 400,
      body: error as string,
    });
  }
};
