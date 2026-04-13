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
  logger.info('Update ADR approval status end point called');

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

    if ("techRecord_adrDetails_dangerousGoods" in recordFromDB && recordFromDB.techRecord_adrDetails_dangerousGoods === false) {
      return addHttpHeaders({ statusCode: 404, body: JSON.stringify({ message: 'Record does not have ADR details' }) });
    }

    const parsedBody = JSON.parse(body ?? '{}') as { adrApproved: boolean; receivedDate: string; };

    // Casting as unknown to bypass TS error for now
    const updatedRecord = {
      ...recordFromDB,
      techRecord_adrDetails_approved: parsedBody.adrApproved,
      techRecord_adrDetails_receivedDate: parsedBody.receivedDate,
    } as unknown as TechRecordType<'get'>;

    const auditDate = new Date().toISOString();
    const updatedNewRecord = setPatchUpdatedAuditDetails(
      updatedRecord,
      userDetails.username,
      userDetails.msOid,
      auditDate,
    );

    const updatedRecordFromDB = setLastUpdatedAuditDetails(
      recordFromDB,
      userDetails.username,
      userDetails.msOid,
      auditDate,
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
