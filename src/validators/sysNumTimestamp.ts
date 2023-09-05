import { APIGatewayProxyEvent } from 'aws-lambda';
import { addHttpHeaders } from '../util/httpHeaders';

// eslint-disable-next-line consistent-return
export const validateSysNumTimestampPathParams = (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.systemNumber) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Missing system number'] }),
    });
  }

  if (!event.pathParameters?.createdTimestamp) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Missing created timestamp'] }),
    });
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters.systemNumber);
  if (systemNumber.length < 3 || systemNumber.length > 21) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ errors: ['The system number should be between 3 and 21 characters.'] }),
    });
  }

  const createdTimestamp = decodeURIComponent(event.pathParameters.createdTimestamp);
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{0,20}Z/i.test(createdTimestamp)) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Invalid created timestamp'] }),
    });
  }
};
