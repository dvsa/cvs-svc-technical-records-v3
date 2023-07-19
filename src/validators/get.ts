import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { add } from 'winston';
import { addHttpHeaders } from '../util/httpHeaders';

// eslint-disable-next-line consistent-return
export const validateGetErrors = (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.systemNumber) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Missing system number',
    });
  }

  if (!event.pathParameters?.createdTimestamp) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Missing created timestamp',
    });
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters.systemNumber);
  if (systemNumber.length < 3 || systemNumber.length > 21) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    });
  }

  const createdTimestamp = decodeURIComponent(event.pathParameters.createdTimestamp);
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{0,20}Z/i.test(createdTimestamp)) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Invalid created timestamp',
    });
  }
};
