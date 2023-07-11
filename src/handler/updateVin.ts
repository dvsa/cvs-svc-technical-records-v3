import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateNewVinNotInUse, validateUpdateVinRequest, validateVins } from "../validators/updateVin";
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria } from "../services/database";
import { addHttpHeaders } from "../util/httpHeaders";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const isRequestInvalid = validateUpdateVinRequest(event)
       
    if(isRequestInvalid){
        return isRequestInvalid
    }
        
    const {msUserDetails, newVin, createdTimestamp, systemNumber } = JSON.parse(event.body!)

    const record: any = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp); 

    const areVinsInvalid = validateVins(record.currentVin, newVin)

    if(areVinsInvalid){
        return areVinsInvalid
    }

    const vinNotInUse = await validateNewVinNotInUse(newVin)

    if(!vinNotInUse){
        return addHttpHeaders({
            statusCode: 400,
            body: "VIN currently in use",
          });
    }

    
        
    return {} as APIGatewayProxyResult
}

