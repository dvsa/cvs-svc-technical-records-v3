import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { SearchCriteria } from '../models/search';
import { UpdateVrmRequestBody } from '../models/updateVrm';
import { processCherishedTransfer } from '../processors/processCherishedTransfer';
import { processCorrectVrm } from '../processors/processCorrectVrm';
import {
  correctVrm,
  getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle,
} from '../services/database';
import { getUserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateUpdateVrmRequest, validateVrmExists, validateVrm } from '../validators/update';

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
    const vrmsNotIncorrectFormat = validateVrm(recipientRecord, newVrm);
    if (vrmsNotIncorrectFormat) {
      return vrmsNotIncorrectFormat;
    }

    const userDetails = getUserDetails(event.headers.Authorization ?? '');

    let donorRecord;
    if (isCherishedTransfer) {
      if (newDonorVrm) {
        const donorRecords = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm);
        const currentDonorRecordDetails = donorRecords.filter((x) => x.techRecord_statusCode === StatusCode.CURRENT);
        if (!currentDonorRecordDetails) {
          return addHttpHeaders({
            statusCode: 400,
            body: `no vehicles with VRM ${newVrm} have a current record`,
          });
        }
        donorRecord = await getBySystemNumberAndCreatedTimestamp(
          currentDonorRecordDetails[0].systemNumber,
          currentDonorRecordDetails[0].createdTimestamp,
        );
        const donorVrmsNotIncorrectFormat = validateVrm(donorRecord, newDonorVrm);
        if (donorVrmsNotIncorrectFormat) {
          return addHttpHeaders(donorVrmsNotIncorrectFormat);
        }
      } else {
        const vrmExists = await validateVrmExists(newVrm);
        if (vrmExists) {
          return vrmExists;
        }
        const [newRecipientRecord, recipientRecordToArchive, newDonorRecord, donorRecordToArchive] = processCherishedTransfer(
          userDetails,
          newVrm,
          recipientRecord,
          newDonorVrm,
          donorRecord,
        );

        await updateVehicle([recipientRecordToArchive, donorRecordToArchive], [newRecipientRecord, newDonorRecord]);

        return addHttpHeaders({
          statusCode: 200,
          body: JSON.stringify(newRecipientRecord),
        });
      }
    }
    const vrmExists = await validateVrmExists(newVrm);
    if (vrmExists) {
      return vrmExists;
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
