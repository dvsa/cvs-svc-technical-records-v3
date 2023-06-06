import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/require-await
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => ({
  statusCode: 200,
  body: 'we"re a hit',
});
