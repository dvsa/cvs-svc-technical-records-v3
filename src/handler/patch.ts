/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import { archiveOldCreateCurrentRecord, getBySystemNumberAndCreatedTimestamp } from '../services/database';
import { getUserDetails } from '../services/user';
import { validateUpdateVinRequest, validateVins } from '../validators/patch';
import { processPatchVinRequest } from '../processors/processPatchVinRequest';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Patch Technical Record Called')

    const isRequestInvalid = validateUpdateVinRequest(event)

    if(isRequestInvalid) {
        return addHttpHeaders({statusCode: 400, body: JSON.stringify({message: isRequestInvalid})})
    }

    logger.info('Request is Valid')

    const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);

    const { newVin } = JSON.parse(event.body!)

    const currentRecord: any = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

    const isVinInvalid = validateVins(currentRecord.vin, newVin);

    if(isVinInvalid) {
        return addHttpHeaders({statusCode: 400, body: JSON.stringify({message: isVinInvalid})});
    }

    logger.info("Vin's have been validated")

    const { recordToArchive, newRecord } = processPatchVinRequest(currentRecord, event);

    try {
        const patchRequest = await archiveOldCreateCurrentRecord(recordToArchive, newRecord);

        return addHttpHeaders({statusCode: 200, body: JSON.stringify(patchRequest)});

    } catch (error) {

        return addHttpHeaders({statusCode: 400, body: JSON.stringify(error)});

    };
}
