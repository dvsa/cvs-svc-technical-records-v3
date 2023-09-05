import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LetterRequestBody } from '../models/letter';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validateLetterErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
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

  const body = JSON.parse(event.body) as LetterRequestBody;

  if (!body.letterType) {
    return {
      statusCode: 400,
      body: 'Letter type not provided',
    };
  }

  if (!body.paragraphId) {
    return {
      statusCode: 400,
      body: 'Paragraph ID not provided',
    };
  }

  if (!body.vtmUsername) {
    return {
      statusCode: 400,
      body: 'No username provided',
    };
  }

  if (!body.recipientEmailAddress) {
    return {
      statusCode: 400,
      body: 'No recipient email provided',
    };
  }

  return undefined;
};
