import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';
import { PromoteRecordRequestBody } from '../models/promote';

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

  const body: PromoteRecordRequestBody = JSON.parse(event.body as string) as PromoteRecordRequestBody;

  if (!body.reasonForPromoting) {
    return {
      statusCode: 400,
      body: 'Reason for promoting not provided',
    };
  }

  return undefined;
};
