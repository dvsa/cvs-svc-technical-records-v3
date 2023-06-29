import {
  CreateTableCommandOutput,
  CreateTableInput,
  DynamoDB,
  DynamoDBClient,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
  WriteRequest,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {marshall} from '@aws-sdk/util-dynamodb';
import techRecordData from '../tests/resources/technical-records-v3.json';

import {SearchResult} from '../src/models/search';
import {dynamoDBClientConfig, tableName} from '../src/config';
import {TableSeedRequest} from './setup-local-tables.model';

type SearchResultKeys = keyof SearchResult;
const flatTechRecordNonKeyAttributes: SearchResultKeys[] = [
  'systemNumber',
  'createdTimestamp',
  'vin',
  'primaryVrm',
  'trailerId',
  'techRecord_vehicleType',
  'techRecord_manufactureYear',
  'techRecord_chassisMake',
  'techRecord_chassisModel',
  'techRecord_make',
  'techRecord_model',
];

let tablesToSetup: CreateTableInput[];
tablesToSetup = [
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
          NonKeyAttributes: flatTechRecordNonKeyAttributes,
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
          NonKeyAttributes: flatTechRecordNonKeyAttributes,
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
          NonKeyAttributes: flatTechRecordNonKeyAttributes,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
      {
        IndexName: 'VinIndex',
        KeySchema: [
          {
            AttributeName: 'vin',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'INCLUDE',
          NonKeyAttributes: flatTechRecordNonKeyAttributes,
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
          NonKeyAttributes: flatTechRecordNonKeyAttributes,
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
    TableName: tableName,
    StreamSpecification: {
      StreamEnabled: false,
    },
  }
]

const dynamoConfig: DynamoDBClientConfig = {...dynamoDBClientConfig, endpoint: process.env.DYNAMO_ENDPOINT};

const setupLocalTables = async () => {
  const ddb = new DynamoDB(dynamoConfig);
  const existingTables = await ddb.listTables({});
  const tables: Promise<CreateTableCommandOutput>[] = [];
  tablesToSetup.forEach((table) => {
    if (!existingTables.TableNames?.find((name) => table.TableName === name)) {
      tables.push(ddb.createTable(table));
    }
  });
  (await Promise.allSettled(tables)).forEach((promise) => {
    console.log(`${promise.status === 'rejected' ? `Did not create table:${JSON.stringify(promise.reason)}` : 'Success'}`);
  });
};

export const seedTables = async (seedingRequest: TableSeedRequest[]) => {
  const command: BatchWriteItemCommandInput = seedingRequest.reduce((prev, {table, data}) => {
    const prevTableData: WriteRequest[] = prev.RequestItems?.[table] ?? [];
    const marshalledData: WriteRequest[] = data.map((item) => ({PutRequest: {Item: marshall(item)}}));
    return {
      RequestItems: {
        ...prev.RequestItems,
        [table]: [...prevTableData, ...marshalledData],
      },
    };
  }, {} as BatchWriteItemCommandInput);
  const docClient = new DynamoDBClient(dynamoConfig);
  await docClient.send(new BatchWriteItemCommand(command));
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await setupLocalTables();
    await seedTables([{
      table: tableName,
      data: techRecordData,
    }]);
  } catch (e) {
    console.log(e);
  }
})();
