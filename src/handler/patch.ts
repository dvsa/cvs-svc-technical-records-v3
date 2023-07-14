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
        
    const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
    const user: any = getUserDetails(event.headers.Authorization!)

    const { newVin } = JSON.parse(event.body!)

    const currentRecord: any = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

    const areVinsInvalid = validateVins(currentRecord.vin, newVin) 

    if(areVinsInvalid){
        return areVinsInvalid
    } 

    const newRecord = { ...currentRecord }

    const date = (new Date()).toISOString()

    newRecord.createdTimestamp = date
    newRecord.vin = newVin
    newRecord.techRecord_createdByName = user
    
    currentRecord.techRecord_statusCode = 'archived'
    currentRecord.techRecord_lastUpdatedAt = date
 
    const updateVin = await updateRecordCreateNew(currentRecord, newRecord)
        
    
    return addHttpHeaders({statusCode: 200, body: JSON.stringify(updateVin)}) 
}

