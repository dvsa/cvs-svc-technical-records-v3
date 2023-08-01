import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
import path from 'path';

const envFile = path.join(__dirname, '../.env');

// read environment variables from .env file
dotenv.config({
  path: path.resolve(envFile),
});

export const dynamoDBClientConfig: DynamoDBClientConfig = {
  endpoint: process.env.AWS_SAM_LOCAL ? process.env.DOCKER_DYNAMO_ENDPOINT : process.env.DYNAMO_ENDPOINT,
  region: process.env.DYNAMO_AWS_REGION,
};
export const tableName = process.env.TABLE_NAME ?? 'local-flat-technical-records';
