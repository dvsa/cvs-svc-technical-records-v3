import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserDetails } from '../services/user';

export class PatchRequestRecords {
  public newRecord: any;

  public recordToArchive: any;

  constructor(
    currentRecord: any,
    event: APIGatewayProxyEvent,
  ) {
    const userDetails = getUserDetails(event.headers.Authorization!);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newVin: string = JSON.parse(event.body!).newVin as string;
    // TODO: Make this a proper type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const recordToArchive: any = { ...currentRecord };
    // TODO: Make this a proper type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const newRecord: any = { ...currentRecord };

    const date: string = new Date().toISOString();

    newRecord.vin = newVin.toUpperCase();
    newRecord.createdTimestamp = date;
    delete newRecord.techRecord_lastUpdatedAt;
    newRecord.techRecord_createdByName = userDetails.username;
    newRecord.techRecord_createdById = userDetails.msOid;

    recordToArchive.techRecord_statusCode = 'archived';
    recordToArchive.techRecord_lastUpdatedAt = date;
    recordToArchive.techRecord_updatedByName = userDetails.username;
    recordToArchive.techRecord_updatedById = userDetails.msOid;
  }
}
