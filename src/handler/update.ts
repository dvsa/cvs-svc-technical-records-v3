/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import { getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { formatTechRecord } from '../util/formatTechRecord';
import { validateUpdateErrors } from '../validators/update';
import { getUserDetails } from '../services/user';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Update end point called');

  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization header' }),
    };
  }
  const userDetails = getUserDetails(event.headers.Authorization);

  const updateErrors = validateUpdateErrors(event);
  if (updateErrors) {
    return addHttpHeaders(updateErrors);
  }

  logger.debug('we passed validation');
  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);

  const oldRecord = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

  const putBody = event.body ? JSON.parse(event.body).techRecord : null;

  // checkStatusCodeValidity()

  const newRecord = { ...oldRecord, ...putBody };

  const date = new Date().toISOString();
  // change status for old record
  const updatedOldRecord = setLastUpdatedAuditDetails(oldRecord, userDetails.username, userDetails.msOid, date);
  const updatedNewRecord = setCreatedAuditDetails(newRecord, userDetails.username, userDetails.msOid, date);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const record = await updateVehicle(updatedOldRecord, updatedNewRecord);

  if (!record || !Object.keys(record).length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching sysNum ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  const formattedRecord = formatTechRecord(record);

  // logger.debug(`formatted record is: ${JSON.stringify(formattedRecord)}`);

  return addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify(formattedRecord),
  });
};

function setLastUpdatedAuditDetails(techRecord: any, createdByName: string, createdById: string, date: string) {
  techRecord.techRecord_lastUpdatedAt = date;
  techRecord.techRecord_lastUpdatedByName = createdByName;
  techRecord.techRecord_lastUpdatedById = createdById;
  return techRecord;
}

function setCreatedAuditDetails(techRecord: any, createdByName: string, createdById: string, date: string) {
  techRecord.techRecord_createdAt = date;
  techRecord.techRecord_createdByName = createdByName;
  techRecord.techRecord_createdById = createdById;
  techRecord.createdTimestamp = date;
  delete techRecord.lastUpdatedAt;
  delete techRecord.lastUpdatedById;
  delete techRecord.lastUpdatedByName;
  return techRecord;
}
