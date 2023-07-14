/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// eslint-disable-next-line consistent-return
export const validateUpdateErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
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

  const systemNumber: string = decodeURIComponent(event.pathParameters.systemNumber);
  if (systemNumber.length < 3 || systemNumber.length > 21) {
    return {
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    };
  }

  const createdTimestamp = decodeURIComponent(event.pathParameters.createdTimestamp);
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{0,20}Z/i.test(createdTimestamp)) {
    return {
      statusCode: 400,
      body: 'Invalid created timestamp',
    };
  }

  const techRec = event.body ? JSON.parse(event.body).techRecord : null;
  if (!techRec) {
    return {
      statusCode: 400,
      body: 'Body does not have any data to update',
    };
  }
};
