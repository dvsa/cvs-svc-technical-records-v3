import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { addHttpHeaders } from "../util/httpHeaders";
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria } from "../services/database";
import { SearchCriteria } from "../models/search";
import { getUserDetails } from "../services/user";

export function validateUpdateVinRequest(event: APIGatewayProxyEvent) {
  if (!event.body) {
    return addHttpHeaders({ statusCode: 400, body: "invalid request" });
  }

  if(!event.headers.Authorization){
    return {
      statusCode: 400,
      body: JSON.stringify("Missing authorization header")
    }
  }
  
  const { newVin } = JSON.parse(
    event.body
  );

  if (!newVin) {
    return addHttpHeaders({
      statusCode: 400,
      body: "You must provide a new VIN",
    });
  }
}
export function validateVins(oldVin: string, newVin: string) {
  console.log('in here')
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