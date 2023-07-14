import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateUpdateVinRequest, validateVins } from "../validators/patch";
import { getBySystemNumberAndCreatedTimestamp, updateRecordCreateNew} from "../services/database";
import { addHttpHeaders } from "../util/httpHeaders";
import { getUserDetails } from "../services/user";
import { formatTechRecord } from "../util/formatTechRecord";
import { validateGetErrors } from "../validators/get";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const isRequestInvalid = validateUpdateVinRequest(event)
       
    if(isRequestInvalid){
        return isRequestInvalid
    }
    // const getErrors = validateGetErrors(event);
    // if (getErrors) {
    //   return addHttpHeaders(getErrors);
    // }
    // const user = getUserDetails(event.headers.Authorization!)
        
    const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);

    const { newVin } = JSON.parse(event.body!)

    const currentRecord: any = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

    const areVinsInvalid = validateVins(currentRecord.vin, newVin) 

    if(areVinsInvalid){
        return areVinsInvalid
    }

    const newRecord = { ...currentRecord }

    newRecord.createdTimestamp = (new Date()).toISOString()
    newRecord.vin = newVin
    // newRecord.techRecord_createdByName = user
    
    currentRecord.statusCode = 'archived'
 
    const updateVin = await updateRecordCreateNew(currentRecord, newRecord)
        
    
    return addHttpHeaders({statusCode: 200, body: JSON.stringify(updateVin)}) 
}

