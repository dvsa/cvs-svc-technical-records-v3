import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  QueryCommand,
  QueryInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
// eslint-disable-next-line import/no-extraneous-dependencies
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import logger from '../util/logger';
import { SearchCriteria, SearchResult, TableIndexes } from '../models/search';
import { dynamoDBClientConfig, tableName } from '../config';

const ddbClient = new DynamoDBClient(dynamoDBClientConfig);
const lambdaClient = new LambdaClient({ region: dynamoDBClientConfig.region });

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
  const systemNumber = await generateSystemNumber();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { vin } = request;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  request.systemNumber = systemNumber;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  request.partialVin = vin.length < 6 ? vin : vin.substring(request.vin.length - 6);
  const params = {
    TableName: tableName,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Item: request,
    ConditionExpression: '#vin <> :vin AND #systemNumber <> :systemNumber',
    ExpressionAttributeNames: {
      '#vin': 'vin',
      '#systemNumber': 'systemNumber',
    },
    ExpressionAttributeValues: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ':vin': { S: vin },
      ':systemNumber': { S: systemNumber },
    },
  };
  return ddbClient.send(new PutItemCommand(params));
};

export const generateSystemNumber = async () : Promise<string> => {
  try {
    if (process.env.AWS_SAM_LOCAL) {
      return '123';
    }
    // the payload (input) to the "my-lambda-func" is a JSON as follows:
    const input = {
      path: '/system-number/',
      httpMethod: 'POST',
      resource: '/system-number/',
    };

    const command = new InvokeCommand({
      FunctionName: process.env.TEST_NUMBER_LAMBDA_NAME,
      InvocationType: 'RequestResponse', // or "Event" for asynchronous invocation
      Payload: JSON.stringify(input),
    });

    const response = await lambdaClient.send(command);
    logger.info(`TEST NUMBER RESPONSE: ${response}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
    return JSON.parse(response.Payload?.toString() ?? '').systemNumber;
    // Handle the response from the invoked Lambda function
  } catch (e) {
    logger.error(`Error in generate system number ${JSON.stringify(e)}`);
    throw new Error('lambda client failed getting data');
  }
};
