import { DeleteTableCommand, DynamoDB } from '@aws-sdk/client-dynamodb';
import { dynamoDBClientConfig } from '../src/config';
import { setupLocalTables } from './setup-local-tables';

export async function deleteLocalTables() {
  const db = new DynamoDB({ ...dynamoDBClientConfig, endpoint: process.env.DYNAMO_ENDPOINT });
  const tables = await db.listTables({});

  const deleteTableCommands = tables.TableNames?.map((tableName) => new DeleteTableCommand({
    TableName: tableName,
  })) ?? [];

  await Promise.allSettled(deleteTableCommands.map((command) => db.send(command)));
}

export async function truncateLocalTables() {
  await deleteLocalTables();
  await setupLocalTables();
}
