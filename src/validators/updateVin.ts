import { APIGatewayProxyEvent } from 'aws-lambda';
import { UpdateVinBody } from '../models/updateVin';
import { ERRORS } from '../util/enum';
import { formatErrorMessage } from '../util/errorMessage';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validateAmendVinPayloadErrors = (event: APIGatewayProxyEvent) => {
  const pathParametersErrors = validateSysNumTimestampPathParams(event);

  if (pathParametersErrors) {
    return pathParametersErrors;
  }

  if (!event.body || !Object.keys(event.body).length) {
    return {
      statusCode: 400,
      body: formatErrorMessage(ERRORS.MISSING_PAYLOAD),
    };
  }
  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: formatErrorMessage(ERRORS.MISSING_AUTH_HEADER),
    };
  }

  const body = JSON.parse(event.body) as UpdateVinBody;

  if (!body.newVin) {
    return {
      statusCode: 400,
      body: formatErrorMessage('No new VIN provided'),
    };
  }

  return undefined;
};
