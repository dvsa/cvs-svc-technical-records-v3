import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { TechrecordGet, TechrecordPut } from '../models/post';
import { processUpdateRequest } from '../processors/processUpdateRequest';
import { getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { getUserDetails } from '../services/user';
import { ERRORS } from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateSysNumTimestampPathParams } from '../validators/sysNumTimestamp';
import { checkStatusCodeValidity, validateUpdateErrors } from '../validators/update';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Update end point called');
  try {
    if (!event.headers.Authorization) {
      return addHttpHeaders({
        statusCode: 400,
        body: JSON.stringify({ error: ERRORS.MISSING_AUTH_HEADER }),
      });
    }
    const isRequestInvalid = validateSysNumTimestampPathParams(event);
    if (isRequestInvalid) {
      return isRequestInvalid;
    }

    const isRequestBodyInvalid = validateUpdateErrors(event.body);
    if (isRequestBodyInvalid) {
      return addHttpHeaders(isRequestBodyInvalid);
    }

    const userDetails = getUserDetails(event.headers.Authorization);

    const systemNumber = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
    const requestBody = JSON.parse(event.body ?? '') as TechrecordPut;

    const recordFromDB = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as TechrecordGet;
    if (!recordFromDB || !Object.keys(recordFromDB).length) {
      return addHttpHeaders({
        statusCode: 404,
        body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
      });
    }

    const statusCodeErrors = checkStatusCodeValidity(recordFromDB.techRecord_statusCode, requestBody.techRecord_statusCode);
    if (statusCodeErrors) {
      return addHttpHeaders(statusCodeErrors);
    }

    const [updatedRecordFromDB, updatedNewRecord] = await processUpdateRequest(recordFromDB, requestBody, userDetails);

    const record = await updateVehicle(updatedRecordFromDB as TechrecordGet, updatedNewRecord);

    const formattedRecord = formatTechRecord(record);

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formattedRecord),
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`${error}`);
    return addHttpHeaders({
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to update record : ${error}` }),
    });
  }
};
