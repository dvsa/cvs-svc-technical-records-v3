import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { UpdateVrmRequestBody } from '../models/updateVrm';
import { processCherishedTransfer } from '../processors/processCherishedTransfer';
import { processCorrectVrm } from '../processors/processCorrectVrm';
import {
  getBySystemNumberAndCreatedTimestamp
} from '../services/database';
import { getUserDetails } from '../services/user';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateUpdateVrmRequest, validateVrm } from '../validators/update';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Amend VRM Called');
    const isRequestInvalid: APIGatewayProxyResult | boolean = validateUpdateVrmRequest(event);
    if (isRequestInvalid) {
      return isRequestInvalid;
    }
    logger.debug('Request is Valid');
    const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
    const { newVrm, isCherishedTransfer, newDonorVrm } = JSON.parse(event.body as string) as UpdateVrmRequestBody;
    const currentRecord = await getBySystemNumberAndCreatedTimestamp(
      systemNumber,
      createdTimestamp,
    );
    const vrmsNotIncorrectFormat = validateVrm(currentRecord, newVrm);
    if (vrmsNotIncorrectFormat) {
      return vrmsNotIncorrectFormat;
    }

    const userDetails = getUserDetails(event.headers.Authorization ?? '');

    if(isCherishedTransfer) {
      return await processCherishedTransfer(userDetails, newVrm, newDonorVrm!, currentRecord)
    } else {
      return await processCorrectVrm(currentRecord, userDetails, newVrm);
    }
};
