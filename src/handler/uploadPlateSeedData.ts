/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { marshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import * as fs from 'fs';
import { insertBatchPlateSeedData } from '../services/database';
import { generateBatchPlateData } from '../util/generateBatchPlateData';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Upload plate seed end point called');

  const fileNames = generateBatchPlateData();

  // eslint-disable-next-line no-restricted-syntax
  for (const fileName of fileNames) {
    console.log(fileName);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const seedData = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    const formattedSeedData = seedData.map((techRec: unknown) => ({
      PutRequest: {
        Item: marshall(techRec, { removeUndefinedValues: true }),
      },
    }));

    const chunkSize = 25;

    for (let i = 0; i < formattedSeedData.length; i += chunkSize) {
      const chunk = formattedSeedData.slice(i, i + chunkSize);
      // eslint-disable-next-line no-await-in-loop
      await insertBatchPlateSeedData(chunk);
    }
  }

  return addHttpHeaders({
    statusCode: 200,
    body: 'Uploaded all plate seed data',
  });
};
