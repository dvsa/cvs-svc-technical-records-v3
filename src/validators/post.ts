import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// eslint-disable-next-line consistent-return
export const validatePostErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: 'Missing POST body',
    };
  }
};
