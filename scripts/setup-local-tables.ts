import {
  CreateTableCommandOutput, CreateTableInput, DynamoDB, DynamoDBClient, BatchWriteItemCommand, BatchWriteItemCommandInput, WriteRequest,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import techRecordData from '../tests/resources/technical-records-v3.json';

const tablesToSetup: CreateTableInput[] = [
  {
    AttributeDefinitions: [
      {
        AttributeName: 'systemNumber',
        AttributeType: 'S',
      },
      {
        AttributeName: 'createdTimestamp',
        AttributeType: 'S',
      },
      {
        AttributeName: 'primaryVrm',
        AttributeType: 'S',
      },
      {
        AttributeName: 'trailerId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'partialVin',
        AttributeType: 'S',
      },
      {
        AttributeName: 'vin',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'systemNumber',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'createdTimestamp',
        KeyType: 'RANGE',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'VRMIndex',
        KeySchema: [
          {
            AttributeName: 'primaryVrm',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: [
            'vin',
            'primaryVrm',
            'secondaryVrms',
            'trailerId',
            'createdTimestamp',
            'systemNumber',
          ],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'TrailerIdIndex',
        KeySchema: [
          {
            AttributeName: 'trailerId',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: [
            'vin',
            'primaryVrm',
            'secondaryVrms',
            'trailerId',
            'createdTimestamp',
            'systemNumber',
          ],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'PartialVinIndex',
        KeySchema: [
          {
            AttributeName: 'partialVin',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: [
            'vin',
            'primaryVrm',
            'secondaryVrms',
            'trailerId',
            'createdTimestamp',
            'systemNumber',
          ],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'vinIndex',
        KeySchema: [
          {
            AttributeName: 'vin',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: [
            'vin',
            'primaryVrm',
            'secondaryVrms',
            'trailerId',
            'createdTimestamp',
            'systemNumber',
          ],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'SysNumIndex',
        KeySchema: [
          {
            AttributeName: 'systemNumber',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: [
            'vin',
            'primaryVrm',
            'secondaryVrms',
            'trailerId',
            'createdTimestamp',
            'systemNumber',
          ],
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
    ],

    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
    TableName: 'local-flat-technical-records',
    StreamSpecification: {
      StreamEnabled: false,
    },
  },

];

const setupLocalTables = async () => {
  const ddb = new DynamoDB({
    endpoint: 'http://localhost:8000',
    region: 'eu-west-2',
  });
  const existingTables = await ddb.listTables({});
  const tables: Promise<CreateTableCommandOutput>[] = [];
  tablesToSetup.forEach((table) => {
    if (!existingTables.TableNames?.find((tableName) => table.TableName === tableName)) {
      tables.push(ddb.createTable(table));
    }
  });
  (await Promise.allSettled(tables)).forEach((promise) => {
    console.log(`${promise.status === 'rejected' ? `Did not create table:${JSON.stringify(promise.reason)}` : 'Success'}`);
  });
};

const seedTables = async () => {
  const docClient = new DynamoDBClient({ region: 'eu-west-2', endpoint: 'http://localhost:8000' });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const marshalledData: WriteRequest[] = techRecordData.map((item) => ({ PutRequest: { Item: marshall(item) } }));
  const command: BatchWriteItemCommandInput = {
    RequestItems: {
      'local-flat-technical-records': marshalledData,
    },
  };
  await docClient.send(new BatchWriteItemCommand(command));
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await setupLocalTables();
    await seedTables();
  } catch (e) {
    console.log(e);
  }
})();
