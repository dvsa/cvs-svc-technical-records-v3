import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

export const dynamoDBClientConfig: DynamoDBClientConfig = {
  endpoint: process.env.AWS_SAM_LOCAL ? process.env.DOCKER_DYNAMO_ENDPOINT : process.env.DYNAMO_ENDPOINT,
  region: process.env.DYNAMO_AWS_REGION,
};
export const tableName = process.env.TABLE_NAME ?? 'local-flat-technical-records';
