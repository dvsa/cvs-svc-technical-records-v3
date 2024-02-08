import {
  BatchWriteItemCommand, BatchWriteItemCommandInput,
  CreateTableCommandOutput, CreateTableInput, DynamoDB, DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { dynamoDBClientConfig, tableName } from '../src/config';
import { SearchResult } from '../src/models/search';
import techRecordData from '../tests/resources/technical-records-v3.json';
import { TableSeedRequest } from './setup-local-tables.model';

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
  'techRecord_statusCode',
  'techRecord_reasonForCreation',
  'techRecord_createdByName',
];

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
  },

];

const dynamoConfig: DynamoDBClientConfig = { ...dynamoDBClientConfig, endpoint: process.env.DYNAMO_ENDPOINT };

export const setupLocalTables = async () => {
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
  // combine requests referring to the same table into a single request
  const tableWriteRequests = new Map<string, Record<string, unknown>[]>();
  seedingRequest.forEach(({ table, data }) => {
    const tableWriteRequest = tableWriteRequests.get(table);
    const tableWriteRequestItems = tableWriteRequest ? [...tableWriteRequest, ...data] : data;
    tableWriteRequests.set(table, tableWriteRequestItems);
  });

  // next: build the write item commands, if a table has more than 25 items split it into multiple commands
  const tableWriteCommands: BatchWriteItemCommandInput[] = [];
  tableWriteRequests.forEach((items, table) => {
    const chunks = [];
    while (items.length > 0) {
      chunks.push(items.splice(0, 25));
    }

    // for each chunk push the table write command, first mapping the items to a put request
    chunks.forEach((chunk) => {
      tableWriteCommands.push({
        RequestItems: {
          [table]: chunk.map((item) => ({
            PutRequest: {
              Item: marshall(item),
            },
          })),
        },
      });
    });
  });

  const docClient = new DynamoDBClient(dynamoConfig);

  // finally: await the sending of all the chunked batch write commands
  await Promise.allSettled(tableWriteCommands.map((command) => docClient.send(new BatchWriteItemCommand(command))));
};

export const seedLocalTables = async () => {
  await seedTables([{
    table: tableName,
    data: techRecordData,
  }]);
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await setupLocalTables();
    await seedLocalTables();
  } catch (e) {
    console.log(e);
  }
})();
