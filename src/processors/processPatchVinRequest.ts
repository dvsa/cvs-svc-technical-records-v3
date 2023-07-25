import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserDetails } from '../services/user';
import { TechrecordGet } from '../models/post';

export const processPatchVinRequest = (currentRecord: TechrecordGet, event: APIGatewayProxyEvent): Array<TechrecordGet> => {
  const userDetails = getUserDetails(event.headers.Authorization!);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newVin: string = JSON.parse(event.body!).newVin as string;

  const recordToArchive: TechrecordGet = { ...currentRecord };

  const newRecord: TechrecordGet = { ...currentRecord };

  const date: string = new Date().toISOString();

  newRecord.vin = newVin.toUpperCase();
  newRecord.createdTimestamp = date;
  delete newRecord.techRecord_lastUpdatedAt;
  newRecord.techRecord_createdByName = userDetails.username;
  newRecord.techRecord_createdById = userDetails.msOid;

  if (newVin.length < 6) {
    newRecord.partialVin = newVin.toUpperCase();
  } else {
    newRecord.partialVin = newVin.substring(newVin.length - 6).toUpperCase();
  }

  recordToArchive.techRecord_statusCode = 'archived';
  recordToArchive.techRecord_lastUpdatedAt = date;
  recordToArchive.techRecord_lastUpdatedByName = userDetails.username;
  recordToArchive.techRecord_lastUpdatedById = userDetails.msOid;

  return [recordToArchive, newRecord];
};
