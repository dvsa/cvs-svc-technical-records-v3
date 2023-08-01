import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PromoteRecordRequestBody } from '../models/promote';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validatePromoteErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
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

  const body: PromoteRecordRequestBody = JSON.parse(event.body) as PromoteRecordRequestBody;

  if (!body.reasonForPromoting) {
    return {
      statusCode: 400,
      body: 'Reason for promoting not provided',
    };
  }

  return undefined;
};
