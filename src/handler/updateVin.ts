import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { formatErrorMessage } from '../util/errorMessage';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';

import { UpdateVinBody } from '../models/updateVin';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { getUserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { checkStatusCodeValidity } from '../validators/update';
import { validateAmendVinPayloadErrors } from '../validators/updateVin';
import { checkVinValidity } from '../validators/vinValidity';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.debug('Amend VIN Called');

    const amendVinPayloadErrors = validateAmendVinPayloadErrors(event);

    if (amendVinPayloadErrors) {
      return addHttpHeaders(amendVinPayloadErrors);
    }

    const userDetails = getUserDetails(event.headers.Authorization ?? '');
    const systemNumber = decodeURIComponent(event.pathParameters?.systemNumber ?? '');
    const createdTimestamp = decodeURIComponent(event.pathParameters?.createdTimestamp ?? '');
    const body = await JSON.parse(event.body ?? '') as UpdateVinBody;

    const recordFromDB = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

    const statusCodeErrors = checkStatusCodeValidity(recordFromDB.techRecord_statusCode);
    if (statusCodeErrors) {
      return addHttpHeaders(statusCodeErrors);
    }

    const vinValidityErrors = checkVinValidity(recordFromDB.vin, body.newVin);
    if (vinValidityErrors) {
      return addHttpHeaders(vinValidityErrors);
    }

    const date = new Date().toISOString();
    const updatedRecordFromDB = setLastUpdatedAuditDetails(
      recordFromDB,
      userDetails.username,
      userDetails.msOid,
      date,
      StatusCode.ARCHIVED,
    );

    const updatedRecord = { ...recordFromDB, vin: body.newVin, techRecord_reasonForCreation: body.reasonForUpdating };

    const updatedNewRecord = setCreatedAuditDetails(
      updatedRecord,
      userDetails.username,
      userDetails.msOid,
      date,
      updatedRecord.techRecord_statusCode as StatusCode,
    );

    await updateVehicle([updatedRecordFromDB], [updatedNewRecord]);

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(updatedNewRecord),
    });
  } catch (err) {
    return addHttpHeaders({
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: formatErrorMessage('Failed to update record'),
    });
  }
};
