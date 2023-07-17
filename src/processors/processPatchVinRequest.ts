import { APIGatewayProxyEvent } from "aws-lambda";
import { getUserDetails } from "../services/user";

export const processPatchVinRequest = (currentRecord: any, event: APIGatewayProxyEvent) => {
    const userDetails = getUserDetails(event.headers.Authorization!);
    const {newVin} = JSON.parse(event.body!);
    const recordToArchive = { ...currentRecord };
    const newRecord: any = { ...currentRecord };

    const date = (new Date).toISOString();

    newRecord.vin = newVin;
    newRecord.createdTimestamp = date;
    delete newRecord.techRecord_lastUpdatedAt;
    newRecord.techRecord_updatedByName = userDetails.username;
    newRecord.techRecord_updatedById = userDetails.msOid;

    recordToArchive.techRecord_statusCode = 'archived';
    recordToArchive.techRecord_lastUpdatedAt = date;
    recordToArchive.techRecord_createdByName = userDetails.username;
    recordToArchive.techRecord_createdById = userDetails.msOid;

    return { newRecord, recordToArchive }

}