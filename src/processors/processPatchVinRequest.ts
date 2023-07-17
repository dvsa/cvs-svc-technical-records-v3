import { APIGatewayProxyEvent } from "aws-lambda";
import { getUserDetails } from "../services/user";

export const processPatchVinRequest = (
  currentRecord: any,
  event: APIGatewayProxyEvent
) => {
  const userDetails = getUserDetails(event.headers.Authorization!);
  const { newVin } = JSON.parse(event.body!);
  const recordToArchive = { ...currentRecord };
  const newRecord: any = { ...currentRecord };

  const date = new Date().toISOString();

  newRecord.vin = newVin.toUpperCase();
  newRecord.createdTimestamp = date;
  delete newRecord.techRecord_lastUpdatedAt;
  newRecord.techRecord_createdByName = userDetails.username;
  newRecord.techRecord_createdById = userDetails.msOid;

  recordToArchive.techRecord_statusCode = "archived";
  recordToArchive.techRecord_lastUpdatedAt = date;
  recordToArchive.techRecord_updatedByName = userDetails.username;
  recordToArchive.techRecord_updatedById = userDetails.msOid;

  return { newRecord, recordToArchive };
};
