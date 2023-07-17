import { APIGatewayProxyEvent } from "aws-lambda";
import { addHttpHeaders } from "../util/httpHeaders";


export function validateUpdateVinRequest(event: APIGatewayProxyEvent) {
  if (!event.body) {
    return addHttpHeaders({
      statusCode: 400, 
      body: JSON.stringify({error: "invalid request"})
    });
  }

  if(!event.headers.Authorization){
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({error: "Missing authorization header"})
    })
  }
  
  const { newVin } = JSON.parse(
    event.body
  );

  if (!newVin) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({error: "You must provide a new VIN"}),
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
    return addHttpHeaders({ 
      statusCode: 400, 
      body: JSON.stringify({error: "New VIN is invalid"}) 
    });
  }
  if (newVin === oldVin) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({error: "New VIN must be different to the current VIN"}),
    });
  }
}