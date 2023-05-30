import {
  CreateTableCommandOutput, CreateTableInput, DynamoDB,
} from '@aws-sdk/client-dynamodb';

const tablesToSetup: CreateTableInput[] = [
  {
    AttributeDefinitions: [
      {
        AttributeName: 'systemNumber',
        AttributeType: 'S',
      },
      {
        AttributeName: 'createdAtTimestamp',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'systemNumber',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'createdAtTimestamp',
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
    TableName: process.env.TABLE_NAME ?? 'local-flat-technical-records',
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await setupLocalTables();
  } catch (e) {
    console.log(e);
  }
})();
