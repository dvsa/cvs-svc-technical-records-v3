import { APIGatewayProxyResult } from 'aws-lambda';

export const addHttpHeaders = (httpResponse: APIGatewayProxyResult): APIGatewayProxyResult => {
  const headers = {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  };

  return { ...httpResponse, headers };
};
