import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DateTime } from 'luxon';

export const validateArchiveErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: 'Missing authorization header',
    };
  }

  if (!event.pathParameters?.systemNumber) {
    return {
      statusCode: 400,
      body: 'Missing system number',
    };
  }

  if (!event.pathParameters?.createdTimestamp) {
    return {
      statusCode: 400,
      body: 'Missing created timestamp',
    };
  }

  const systemNumber: string = event.pathParameters?.systemNumber;
  if (systemNumber.length < 3 || systemNumber.length > 21) {
    return {
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    };
  }

  const createdTimestamp = event.pathParameters?.createdTimestamp;
  if (!isISO8601Date(createdTimestamp)) {
    return {
      statusCode: 400,
      body: 'Invalid created timestamp',
    };
  }

  return undefined;

  function isISO8601Date(input: string): boolean {
    return DateTime.fromISO(input).isValid;
  }
};
