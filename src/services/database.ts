/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput, PutItemCommand,
  QueryCommand,
  QueryInput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../util/logger';
import { SearchCriteria, SearchResult, TableIndexes } from '../models/search';
import { dynamoDBClientConfig, tableName } from '../config';
import { generateNewNumber, NumberTypes } from './testNumber';

const ddbClient = new DynamoDBClient(dynamoDBClientConfig);

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
    logger.debug(JSON.stringify(data));
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
export const postTechRecord = async (request: any) => {
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  logger.info(`system number : ${systemNumber}`);
  if (request.techRecord_vehicleType !== 'trl' && !request.primaryVrm) {
    request.primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && request.techRecord.trailerId) {
    request.trailerId = await generateNewNumber(NumberTypes.TrailerId);
  } else if (request.techRecord_euVehicleCategory === ('o1' || 'o2')) {
    request.trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  const { vin } = request;
  request.systemNumber = systemNumber;
  request.createdTimestamp = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  request.partialVin = vin.length < 6 ? vin : vin.substring(request.vin.length - 6);
  logger.info('request');
  logger.info(request);
  logger.info(`table name: ${tableName}`);
  const command = {
    TableName: tableName,
    ConditionExpression: '#vin <> :vin AND #systemNumber <> :systemNumber',
    ExpressionAttributeNames: {
      '#vin': 'vin',
      '#systemNumber': 'systemNumber',
    },
    ExpressionAttributeValues: {
      ':vin': { S: vin },
      ':systemNumber': { S: systemNumber },
    },
    Item: request,
  };
  logger.info('we have got to try and catch');
  try {
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
    logger.info('doc client made');
    const response = await ddbDocClient.send(new PutItemCommand(command));
    logger.info(response);
    return response;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`this is the error ${err}`);
  }
  return null;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  // logger.info(`this is the response ${response}`);
  // console.log(response, 'this is the response');
};
