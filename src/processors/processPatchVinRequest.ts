import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserDetails } from '../services/user';
import { TechrecordGet } from '../models/post';

export class PatchRequestRecords {
  public newRecord: TechrecordGet;

  public recordToArchive: TechrecordGet;

  constructor(
    currentRecord: any,
    event: APIGatewayProxyEvent,
  ) {
    const userDetails = getUserDetails(event.headers.Authorization!);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newVin: string = JSON.parse(event.body!).newVin as string;
    // TODO: Make this a proper type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.recordToArchive = { ...currentRecord };
    // TODO: Make this a proper type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.newRecord = { ...currentRecord };

    const date: string = new Date().toISOString();

    this.newRecord.vin = newVin.toUpperCase();
    this.newRecord.createdTimestamp = date;
    delete this.newRecord.techRecord_lastUpdatedAt;
    this.newRecord.techRecord_createdByName = userDetails.username;
    this.newRecord.techRecord_createdById = userDetails.msOid;

    this.recordToArchive.techRecord_statusCode = 'archived';
    this.recordToArchive.techRecord_lastUpdatedAt = date;
    this.recordToArchive.techRecord_lastUpdatedByName = userDetails.username;
    this.recordToArchive.techRecord_lastUpdatedById = userDetails.msOid;
  }
}
