import { DynamoDBClient, QueryCommand, QueryInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../util/logger';

const ddbClient = new DynamoDBClient({ region: 'eu-west-1' });
const tableName = process.env.TABLE_NAME ?? 'cvs-develop-flat-tech-records';

export const searchByCriteria = async (searchCriteria: string, searchIdentifier: string) => {
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
    return data.Items?.map((item) => unmarshall(item));
  } catch (e) {
    console.log('Error in search by criteria:', e);
    throw new Error(`database client failed getting data by ${searchCriteria} with ${searchIdentifier}`);
  }
};

export const searchByAll = async (searchIdentifier: string) => {
  const databaseCallPromises: any[] = [];
  Object.keys(CriteriaIndexMap).forEach((searchCriteria) => {
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

    const queryPromise = new Promise((resolve, reject) => {
      ddbClient.send(new QueryCommand(query)).then((data) => {
        logger.debug(JSON.stringify(data));
        resolve(data.Items?.map((item) => unmarshall(item)));
      }).catch((e) => {
        console.log('Error in search by criteria:', e);
        reject(new Error(`database client failed getting data by ${searchCriteria} with ${searchIdentifier}`));
      });
    });

    databaseCallPromises.push(queryPromise);
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (await Promise.all(databaseCallPromises)).flat();
};

const CriteriaIndexMap: { [key: string]: string } = {
  systemNumber: 'SysNumIndex',
  partialVin: 'PartialVinIndex',
  primaryVrm: 'VRMIndex',
  vin: 'VinIndex',
  trailerId: 'TrailerIdIndex',
};
