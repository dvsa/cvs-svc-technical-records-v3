/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryInput, TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import polly from 'polly-js';
import { dynamoDBClientConfig, tableName } from '../config';
import { TechrecordGet } from '../models/post';
import { SearchCriteria, SearchResult, TableIndexes } from '../models/search';
import logger from '../util/logger';

const ddbClient = new DynamoDBClient(dynamoDBClientConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const searchByCriteria = async (searchCriteria: Exclude<SearchCriteria, SearchCriteria.ALL>, searchIdentifier: string): Promise<SearchResult[]> => {
  const query: QueryInput = {
    TableName: tableName,
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
    logger.debug(JSON.stringify(data));
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

export const getBySystemNumberAndCreatedTimestamp = async (systemNumber: string, createdTimestamp: string): Promise<object> => {
  const command: GetItemCommandInput = {
    TableName: tableName,
    Key: marshall({
      systemNumber,
      createdTimestamp,
    }),
  };

  try {
    const data = await ddbClient.send(new GetItemCommand(command));
    // logger.debug(JSON.stringify(data));
    return unmarshall(data.Item || {});
  } catch (e: any) {
    logger.error(`Error in search by sysnum and time: ${JSON.stringify(e)}`);
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

export const postTechRecord = async (request: TechrecordGet): Promise <TechrecordGet> => {
  logger.info('about to post');

  try {
    const command: PutItemCommandInput = {
      TableName: tableName,
      ConditionExpression: '#createdTimestamp <> :createdTimestamp AND #systemNumber <> :systemNumber',
      ExpressionAttributeNames: {
        '#createdTimestamp': 'createdTimestamp',
        '#systemNumber': 'systemNumber',
      },
      ExpressionAttributeValues: {
        ':createdTimestamp': { S: request.createdTimestamp! },
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

export const updateVehicle = async (oldRecord: any, newRecord: any): Promise<object> => {
  logger.info('inside updateVehicle');
  logger.debug(oldRecord.createdTimestamp);
  logger.debug(newRecord.createdTimestamp);
  const transactWriteParams: TransactWriteCommandInput = {
    TransactItems: [
      {
        Put: {
          TableName: tableName,
          Item: marshall(oldRecord),
          ConditionExpression: 'attribute_exists(systemNumber) AND attribute_exists(createdTimestamp)',
        },
      },
      {
        Put: {
          TableName: tableName,
          Item: marshall(newRecord),
        },
      },
    ],
  };

  const sendTransaction = new Promise<object>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    docClient.send(new TransactWriteItemsCommand(transactWriteParams)).then(() => {
      logger.debug('Resolving with success');
      resolve(newRecord);
    }).catch((error: Error) => {
      logger.error('Rejecting with an error', error);
      reject(error.message);
    });
  });

  return polly().waitAndRetry(3).executeForPromise(() => sendTransaction);
};
