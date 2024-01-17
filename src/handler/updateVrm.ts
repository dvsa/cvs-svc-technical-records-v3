import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { SNSMessageBody, UpdateVrmRequestBody } from '../models/updateVrm';
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
import { formatErrorMessage } from '../util/errorMessage';
import { publish } from '../services/sns';

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
    const { newVrm, isCherishedTransfer, thirdMark } = JSON.parse(event.body as string) as UpdateVrmRequestBody;
    const recipientRecord = await getBySystemNumberAndCreatedTimestamp(
      systemNumber,
      createdTimestamp,
    );

    const newVrmNotCorrectFormat = validateVrm(recipientRecord, newVrm);
    if (newVrmNotCorrectFormat) {
      return newVrmNotCorrectFormat;
    }

    const userDetails = getUserDetails(event.headers.Authorization ?? '');

    if (isCherishedTransfer === true) {
      logger.debug('Performing cherished Transfer');

      if (!thirdMark?.length) {
        const newVrmExistsOnActiveRecord = await validateVrmExists(newVrm);
        if (newVrmExistsOnActiveRecord) {
          return newVrmExistsOnActiveRecord;
        }
      }

      const [donorVehicleRecord, error] = await donorVehicle(newVrm, thirdMark) as [TechRecordType<'get'>, APIGatewayProxyResult];
      if (error?.statusCode) {
        return error;
      }

      const { recordsToArchive, recordsToUpdate } = processCherishedTransfer(
        userDetails,
        newVrm,
        recipientRecord,
        thirdMark,
        donorVehicleRecord,
      );

      await updateVehicle(recordsToArchive, recordsToUpdate);

      const recordsToSend: SNSMessageBody[] = [];

      recordsToUpdate.forEach((record) => recordsToSend.push({ ...record, userEmail: userDetails.email }));

      await publish(JSON.stringify(recordsToSend), process.env.VRM_TRANSFERRED_ARN ?? '');

      return addHttpHeaders({
        statusCode: 200,
        body: JSON.stringify(recordsToUpdate[0]),
      });
    }

    logger.debug('Correcting an error');
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
      body: formatErrorMessage('Failed to update record'),
    });
  }
};
