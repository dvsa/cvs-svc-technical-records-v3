import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { addHttpHeaders } from "../util/httpHeaders";
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria } from "../services/database";
import { SearchCriteria } from "../models/search";

export function validateUpdateVinRequest(event: APIGatewayProxyEvent) {
  if (!event.body) {
    return addHttpHeaders({ statusCode: 400, body: "invalid request" });
  }
  const { msUserDetails, newVin, createdTimestamp, systemNumber } = JSON.parse(
    event.body
  );

  if (!msUserDetails) {
    return addHttpHeaders({
      statusCode: 400,
      body: "Microsoft user details not provided",
    });
  }

  if (!newVin) {
    return addHttpHeaders({
      statusCode: 400,
      body: "You must provide a new VIN",
    });
  }

  if (!createdTimestamp) {
    return addHttpHeaders({
      statusCode: 400,
      body: "You must provide a createdTimestamp",
    });
  }

  if (!systemNumber) {
    return addHttpHeaders({
      statusCode: 400,
      body: "You must provide a System Number",
    });
  }
}
export function validateVins(oldVin: string, newVin: string) {
  if (
    !newVin ||
    newVin.length < 3 ||
    newVin.length > 21 ||
    typeof newVin !== "string"
  ) {
    return addHttpHeaders({ statusCode: 400, body: "New VIN is invalid" });
  }
  if (newVin === oldVin) {
    return addHttpHeaders({
      statusCode: 400,
      body: "New VIN must be different to the current VIN",
    });
  }
}