import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { getBySystemNumberAndCreatedTimestamp, updateVehicle } from '../services/database';
import { getUserDetails } from '../services/user';
import { ERRORS, StatusCode } from '../util/enum';
import { formatErrorMessage } from '../util/errorMessage';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateSysNumTimestampPathParams } from '../validators/sysNumTimestamp';
import { checkStatusCodeValidity } from '../validators/update';
import { setLastUpdatedAuditDetails, setPatchUpdatedAuditDetails } from '../services/audit';
import {
  validateUpdateApprovalStatusErrors,
} from '../validators/updateApprovalStatus';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Patch end point called');

  try {
    const isRequestInvalid = validateSysNumTimestampPathParams(event);
    if (isRequestInvalid) return isRequestInvalid;

    const { body } = event;

    const isRequestBodyInvalid = validateUpdateApprovalStatusErrors(body);
    if (isRequestBodyInvalid) return addHttpHeaders(isRequestBodyInvalid);

    const userDetails = getUserDetails(event.headers.Authorization ?? '');
    const systemNumber = decodeURIComponent(event.pathParameters?.systemNumber ?? '');
    const createdTimestamp = decodeURIComponent(event.pathParameters?.createdTimestamp ?? '');

    const recordFromDB = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);
    if (!recordFromDB) return addHttpHeaders({ statusCode: 404, body: JSON.stringify({ message: 'Record not found.' }) });

    const statusCodeErrors = checkStatusCodeValidity(recordFromDB.techRecord_statusCode);
    if (statusCodeErrors) return addHttpHeaders(statusCodeErrors);

    const parsedBody = JSON.parse(body ?? '{}') as { adrComplete: boolean; receivedDate: string; };

    // @TODO: Possibly need a check here to check that adr is applicable to the record?
    // Maybe check if there is an adr_details key on the object, if not throw it out?
    // Casting as unknown to bypass TS error for now
    const updatedRecord = {
      ...recordFromDB,
      techRecord_adrDetails_approved: parsedBody.adrComplete,
      techRecord_adrDetails_receivedDate: parsedBody.receivedDate,
    } as unknown as TechRecordType<'get'>;

    const date = new Date().toISOString();
    const updatedNewRecord = setPatchUpdatedAuditDetails(
      updatedRecord,
      userDetails.username,
      userDetails.msOid,
      date,
    );

    const updatedRecordFromDB = setLastUpdatedAuditDetails(
      recordFromDB,
      userDetails.username,
      userDetails.msOid,
      date,
      StatusCode.ARCHIVED,
    );

    await updateVehicle([updatedRecordFromDB], [updatedNewRecord]);
    logger.debug(JSON.stringify(updatedNewRecord));

    return addHttpHeaders({
      statusCode: 204,
      body: JSON.stringify({}),
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`${error}`);
    return addHttpHeaders({
      statusCode: 500,
      body: formatErrorMessage(ERRORS.FAILED_UPDATE_MESSAGE),
    });
  }
};
