import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserDetails } from '../services/user';
import { TechrecordGet } from '../models/post';

export const processPatchVrmRequest = (currentRecord: TechrecordGet, event: APIGatewayProxyEvent): Array<TechrecordGet> => {
  const userDetails = getUserDetails(event.headers.Authorization!);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newVrm: string = JSON.parse(event.body!).newVrm as string;
  const recordToArchive: TechrecordGet = { ...currentRecord };
  const newRecord: TechrecordGet = { ...currentRecord };
  const date: string = new Date().toISOString();

  if ('primaryVrm' in newRecord) {
    newRecord.primaryVrm = newVrm.toUpperCase();
  }

  newRecord.createdTimestamp = date;
  delete newRecord.techRecord_lastUpdatedAt;
  newRecord.techRecord_createdByName = userDetails.username;
  newRecord.techRecord_createdById = userDetails.msOid;
  recordToArchive.techRecord_statusCode = 'archived';
  recordToArchive.techRecord_lastUpdatedAt = date;
  recordToArchive.techRecord_lastUpdatedByName = userDetails.username;
  recordToArchive.techRecord_lastUpdatedById = userDetails.msOid;

  return [recordToArchive, newRecord];
};
