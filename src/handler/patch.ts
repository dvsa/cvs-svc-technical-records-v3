import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateUpdateVinRequest, validateVins } from "../validators/patch";
import { getBySystemNumberAndCreatedTimestamp, updateCurrentCreateNew} from "../services/database";
import { addHttpHeaders } from "../util/httpHeaders";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const isRequestInvalid = validateUpdateVinRequest(event)
       
    if(isRequestInvalid){
        return isRequestInvalid
    }
        
    const {msUserDetails, newVin, createdTimestamp, systemNumber } = JSON.parse(event.body!)

    const currentRecord: any = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp); 

    const areVinsInvalid = validateVins(currentRecord.currentVin, newVin)

    if(areVinsInvalid){
        return areVinsInvalid
    }

    const newRecord = { ...currentRecord }

    newRecord.createdTimestamp = (new Date()).toISOString()
    newRecord.vin = newVin
    newRecord.techRecord_createdByName = msUserDetails
    
    currentRecord.statusCode = 'archived'
 
    const updateVin = await updateCurrentCreateNew(currentRecord, newRecord)
        
    return {} as APIGatewayProxyResult
}

