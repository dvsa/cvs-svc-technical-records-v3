import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { TechRecordCar } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { UpdateVrmRequestBody } from '../models/updateVrm';
import { processCherishedTransfer } from '../processors/processCherishedTransfer';
import { processCorrectVrm } from '../processors/processCorrectVrm';
import {
  getBySystemNumberAndCreatedTimestamp, updateVehicle,
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
  try {
    if (isCherishedTransfer) {
      const [
        newRecipientRecord,
        recipientRecordToArchive,
        newDonorRecord,
        donorRecordToArchive,
      ]: Promise<TechRecordType<'get'>[]> | APIGatewayProxyResult = processCherishedTransfer(userDetails, newVrm, currentRecord, newDonorVrm);
      await updateVehicle([recipientRecordToArchive, donorRecordToArchive], [newRecipientRecord, newDonorRecord]);
    }
  } catch (err) {
    return addHttpHeaders(
      {
        statusCode: 400,
        body: err,
      },
    );
  }
  return processCorrectVrm(currentRecord, userDetails, newVrm);
};
