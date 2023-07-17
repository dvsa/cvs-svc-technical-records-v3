/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import { archiveOldCreateCurrentRecord, getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { formatTechRecord } from '../util/formatTechRecord';
import { validateUpdateErrors } from '../validators/update';
import { getUserDetails } from '../services/user';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Patch Technical Record Called')

  const userDetails = getUserDetails(event.headers.Authorization!);

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);

  const { newVin } = JSON.parse(event.body!)

  const currentRecord: any = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

  const newRecord: any = { ...currentRecord };

  const date = (new Date).toISOString();

  newRecord.vin = newVin;
  newRecord.createdTimestamp = date;
  delete newRecord.techRecord_lastUpdatedAt;
  newRecord.techRecord_updatedByName = userDetails.username;
  newRecord.techRecord_updatedById = userDetails.msOid;

  currentRecord.techRecord_statusCode = 'archived';
  currentRecord.techRecord_lastUpdatedAt = date;
  currentRecord.techRecord_createdByName = userDetails.username;
  currentRecord.techRecord_createdById = userDetails.msOid;

  try{
    const patchRequest = await archiveOldCreateCurrentRecord(currentRecord, newRecord)

    return addHttpHeaders({statusCode: 200, body: JSON.stringify(patchRequest)})
  } catch (error) {
    return addHttpHeaders({statusCode: 400, body: JSON.stringify(error)})
  }
}
