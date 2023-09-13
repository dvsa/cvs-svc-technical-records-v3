import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';
import { UnarchiveRequestBody } from '../models/unarchive';
import { StatusCode } from '../util/enum';

export const validateUnarchiveErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: 'Missing authorization header',
    };
  }

  const isPathInvalid: APIGatewayProxyResult | undefined = validateSysNumTimestampPathParams(event);

  if (isPathInvalid) {
    return isPathInvalid;
  }

  if (!event.body || !Object.keys(event.body).length) {
    return {
      statusCode: 400,
      body: 'invalid request',
    };
  }

  const body: UnarchiveRequestBody = JSON.parse(event.body) as UnarchiveRequestBody;

  if (!body.reasonForUnarchiving) {
    return {
      statusCode: 400,
      body: 'Reason for unarchiving not provided',
    };
  }

  const validStatusCodes = [StatusCode.CURRENT, StatusCode.PROVISIONAL];
  const statusCodeIsValid = validStatusCodes.some((statusCode) => {
    return statusCode === body?.status;
  });

  if (!statusCodeIsValid) {
    return {
      statusCode: 400,
      body: 'Invalid status provided',
    };
  }

  return undefined;
};
