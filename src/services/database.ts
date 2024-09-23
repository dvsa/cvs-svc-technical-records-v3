import {
  AttributeValue,
  BatchWriteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryInput,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import polly from 'polly-js';
import { dynamoDBClientConfig, tableName } from '../config';
import { SearchCriteria, SearchResult, TableIndexes } from '../models/search';
import logger from '../util/logger';

const ddbClient = new DynamoDBClient(dynamoDBClientConfig);

export const archiveRecord = async (record: TechRecordType<'get'>) : Promise<object> => {
  const command = {
    TableName: tableName,
    Item: marshall(record as unknown as Record<string, AttributeValue>, { removeUndefinedValues: true }),
  };

  try {
    return await ddbClient.send(new PutItemCommand(command));
  } catch (e) {
    logger.error('Error in archive record: ', e);
    throw new Error(
      `database client failed in archiving the record with systemNumber ${record.systemNumber} and createdTimestamp ${record.createdTimestamp} `,
    );
  }
};

export const searchByCriteria = async (searchCriteria: Exclude<SearchCriteria, SearchCriteria.ALL>, searchIdentifier: string)
: Promise<SearchResult[]> => {
  const query: QueryInput = {
    TableName: tableName,
    // eslint-disable-next-line security/detect-object-injection
    IndexName: CriteriaIndexMap[searchCriteria],
    KeyConditionExpression: `#${searchCriteria} = :${searchCriteria}`,
    ExpressionAttributeNames: {
      [`#${searchCriteria}`]: searchCriteria,
    },
    ExpressionAttributeValues: {
      [`:${searchCriteria}`]: { S: searchIdentifier },
    },
  };

  try {
    const data = await ddbClient.send(new QueryCommand(query));
    logger.debug(`DATA FROM DB ${JSON.stringify(data)}`);
    return (data.Items?.map((item) => unmarshall(item)) ?? []) as SearchResult[];
  } catch (e) {
    logger.error('Error in search by criteria: ', e);
    throw new Error(`database client failed getting data by ${searchCriteria} with ${searchIdentifier}`);
  }
};

export const searchByAll = async (searchIdentifier: string): Promise<SearchResult[]> => {
  const databaseCallPromises: Promise<SearchResult[]>[] = [];
  Object.keys(CriteriaIndexMap).forEach((searchCriteria) => {
    const query: QueryInput = {
      TableName: tableName,
      IndexName: CriteriaIndexMap[searchCriteria as keyof typeof CriteriaIndexMap],
      KeyConditionExpression: `#${searchCriteria} = :${searchCriteria}`,
      ExpressionAttributeNames: {
        [`#${searchCriteria}`]: searchCriteria,
      },
      ExpressionAttributeValues: {
        [`:${searchCriteria}`]: { S: searchIdentifier },
      },
    };

    const queryPromise = new Promise<SearchResult[]>((resolve, reject) => {
      ddbClient.send(new QueryCommand(query)).then((data) => {
        logger.debug(`data for ${searchCriteria}: ${JSON.stringify(data)}`);
        resolve((data.Items?.map((item) => unmarshall(item)) ?? []) as SearchResult[]);
      }).catch((e) => {
        logger.error('Error in search by criteria: ', e);
        reject(new Error(`database client failed getting data by ${searchCriteria} with ${searchIdentifier}`));
      });
    });

    databaseCallPromises.push(queryPromise);
  });

  try {
    return (await Promise.all(databaseCallPromises)).flat();
  } catch {
    logger.debug('One of the promises rejected when calling the database');
    throw new Error('Error in calling the database');
  }
};

export const getBySystemNumberAndCreatedTimestamp = async (systemNumber: string, createdTimestamp: string): Promise<TechRecordType<'get'>> => {
  const command: GetItemCommandInput = {
    TableName: tableName,
    Key: marshall({
      systemNumber,
      createdTimestamp,
    }),
  };

  try {
    const data = await ddbClient.send(new GetItemCommand(command));
    logger.debug(JSON.stringify(data));
    return unmarshall(data.Item ?? {}) as TechRecordType<'get'>;
  } catch (error) {
    logger.error(`Error in search by sysnum and time: ${JSON.stringify(error)}`);
    throw new Error(`database client failed getting data by ${systemNumber} and ${createdTimestamp}`);
  }
};

const CriteriaIndexMap: Record<Exclude<SearchCriteria, SearchCriteria.ALL>, TableIndexes> = {
  systemNumber: 'SysNumIndex',
  partialVin: 'PartialVinIndex',
  primaryVrm: 'VRMIndex',
  vin: 'VinIndex',
  trailerId: 'TrailerIdIndex',
};

export const postTechRecord = async (request: TechRecordType<'get'>): Promise <TechRecordType<'get'>> => {
  logger.info(`Posting record: ${JSON.stringify(request)}`);

  try {
    const command: PutItemCommandInput = {
      TableName: tableName,
      ConditionExpression: '#createdTimestamp <> :createdTimestamp AND #systemNumber <> :systemNumber',
      ExpressionAttributeNames: {
        '#createdTimestamp': 'createdTimestamp',
        '#systemNumber': 'systemNumber',
      },
      ExpressionAttributeValues: {
        ':createdTimestamp': { S: request.createdTimestamp },
        ':systemNumber': { S: request.systemNumber },
      },
      Item: marshall(request, { removeUndefinedValues: true }),
    };

    await ddbClient.send(new PutItemCommand(command));
    return request;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Error: ${err}`);
    throw new Error('database client failed getting data');
  }
};

export const updateVehicle = async (recordsToArchive: TechRecordType<'get'>[], newRecords: TechRecordType<'get'>[]): Promise<object> => {
  logger.info(`Creating new records: ${JSON.stringify(newRecords)}`);
  const archivedRecordsInfo = recordsToArchive.map((r) => `systemNumber: ${r.systemNumber} and createdTimestamp: ${r.createdTimestamp}`).join('\n');
  logger.info(`Archiving records: ${archivedRecordsInfo}`);

  const transactWriteParams: TransactWriteCommandInput = { TransactItems: [] };

  recordsToArchive.forEach((record) => {
    transactWriteParams.TransactItems?.push(
      {
        Put: {
          TableName: tableName,
          Item: marshall(record, { removeUndefinedValues: true }),
          ConditionExpression: 'attribute_exists(systemNumber) AND attribute_exists(createdTimestamp)',
        },
      },
    );
  });

  newRecords.forEach((record) => {
    transactWriteParams.TransactItems?.push({
      Put: {
        TableName: tableName,
        Item: marshall(record, { removeUndefinedValues: true }),
      },
    });
  });

  const sendTransaction = new Promise<object>((resolve, reject) => {
    ddbClient.send(new TransactWriteItemsCommand(transactWriteParams)).then(() => {
      logger.debug('Resolving with success');
      resolve(newRecords);
    }).catch((error: Error) => {
      logger.error('Rejecting with an error', error);
      reject(error.message);
    });
  });

  return polly().waitAndRetry(3).executeForPromise(() => sendTransaction);
};
// WARNING: This will update a record in place and not archive, do not abuse this and only use when needed
export const inPlaceRecordUpdate = async (updatedRecord: TechRecordType<'get'>) => {
  const command = {
    TableName: tableName,
    Item: marshall(updatedRecord as unknown as Record<string, AttributeValue>),
    ConditionExpression: 'attribute_exists(systemNumber) AND attribute_exists(createdTimestamp)',
  };

  try {
    return await ddbClient.send(new PutItemCommand(command));
  } catch (e) {
    logger.error('Error in record in place update: ', e);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(
      // eslint-disable-next-line max-len
      `database client failed in updating in place the record with systemNumber ${updatedRecord.systemNumber} and createdTimestamp ${updatedRecord.createdTimestamp}`,
    );
  }
};

// DO NOT USE THIS UNLESS FOR SEED DATA FOR PLATES
export const insertBatchPlateSeedData = async (putRequests: any) => {
  const command = new BatchWriteItemCommand({
    RequestItems: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [tableName]: putRequests,
    },
  });

  try {
    await ddbClient.send((command));
  } catch (err) {
    logger.error('Error in batch upload for plates: ', err);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(
      // eslint-disable-next-line max-len
      'database client failed in batch plate uploader',
    );
  }
};

export const correctVrm = async (newRecord: TechRecordType<'get'>): Promise<object> => {
  logger.info('correcting a VRM');
  const putItemInput: PutItemCommandInput = {
    TableName: tableName,
    Item: marshall(newRecord),
  };
  const sendPutRequest = new Promise<object>((resolve, reject) => {
    ddbClient.send(new PutItemCommand(putItemInput)).then((record) => {
      logger.debug('Resolving with success');
      resolve(record);
    }).catch((error: Error) => {
      logger.error('Rejecting with an error', error);
      reject(error.message);
    });
  });
  return sendPutRequest;
};
