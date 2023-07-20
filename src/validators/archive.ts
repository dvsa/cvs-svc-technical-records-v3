import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';
import { ArchiveRecordRequestBody } from '../models/archive';

export const validateArchiveErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
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

  const body: ArchiveRecordRequestBody = JSON.parse(event.body as string) as ArchiveRecordRequestBody;

  if (!body.reasonForArchiving) {
    return {
      statusCode: 400,
      body: 'Reason for archiving not provided',
    };
  }

  return;
};
