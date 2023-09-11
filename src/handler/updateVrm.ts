import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { UpdateVrmRequestBody } from '../models/updateVrm';
import { processCherishedTransfer } from '../processors/processCherishedTransfer';
import { processCorrectVrm } from '../processors/processCorrectVrm';
import {
  correctVrm,
  getBySystemNumberAndCreatedTimestamp,
  updateVehicle,
} from '../services/database';
import { donorVehicle } from '../services/donorVehicle';
import { getUserDetails } from '../services/user';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateUpdateVrmRequest, validateVrm, validateVrmExists } from '../validators/update';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.debug('Amend VRM Called');
    const isRequestInvalid: APIGatewayProxyResult | boolean = validateUpdateVrmRequest(event);
    if (isRequestInvalid) {
      return isRequestInvalid;
    }
    logger.debug('Request is Valid');
    const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
    const { newVrm, isCherishedTransfer, newDonorVrm } = JSON.parse(event.body as string) as UpdateVrmRequestBody;
    const recipientRecord = await getBySystemNumberAndCreatedTimestamp(
      systemNumber,
      createdTimestamp,
    );
    const newVrmNotCorrectFormat = validateVrm(recipientRecord, newVrm);
    if (newVrmNotCorrectFormat) {
      return newVrmNotCorrectFormat;
    }

    const userDetails = getUserDetails(event.headers.Authorization ?? '');

    if (isCherishedTransfer) {
      const [donorVehicleRecord, error] = await donorVehicle(newVrm, newDonorVrm) as [TechRecordType<'get'>, APIGatewayProxyResult | undefined];

      if (error) {
        return error;
      }

      const [newRecipientRecord, recipientRecordToArchive, newDonorRecord, donorRecordToArchive] = processCherishedTransfer(
        userDetails,
        newVrm,
        recipientRecord,
        newDonorVrm,
        donorVehicleRecord,
      );
      console.log('hiya');

      await updateVehicle([recipientRecordToArchive, donorRecordToArchive], [newRecipientRecord, newDonorRecord]);

      return addHttpHeaders({
        statusCode: 200,
        body: JSON.stringify(newRecipientRecord),
      });
    }
    const newVrmExistsOnActiveRecord = await validateVrmExists(newVrm);
    if (newVrmExistsOnActiveRecord) {
      return newVrmExistsOnActiveRecord;
    }
    logger.debug('identifier has been validated');
    const newRecipientRecord = processCorrectVrm(recipientRecord, userDetails, newVrm);

    await correctVrm(newRecipientRecord);

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(newRecipientRecord),
    });
  } catch (err) {
    return addHttpHeaders({
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to update record : ${err}` }),
    });
  }
};
