/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import 'dotenv/config';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { postTechRecord } from '../services/database';
import logger from '../util/logger';
import { generateNewNumber, NumberTypes } from '../services/testNumber';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<{ body: unknown; statusCode: number }> => {
  logger.info('Post end point called');
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Body is not a valid TechRecord' }),
      };
    }
    // TODO to use proper type when we have them
    const requestBody: any = processRequest(JSON.parse(event.body));
    await postTechRecord(requestBody);
    logger.info('put item command sent');
    return {
      statusCode: 200,
      body: JSON.stringify(requestBody),
    };
  } catch
  (error) {
    logger.error(`Error has been thrown with ${JSON.stringify(error)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add record to DynamoDB' }),
    };
  }
};

export const processRequest = async (request: any) => {
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  if (request.techRecord_vehicleType !== 'trl' && !request.primaryVrm) {
    request.primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId && request.techRecord_euVehicleCategory === 'o1') {
    request.trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId && request.techRecord_euVehicleCategory === 'o2') {
    request.trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId) {
    request.trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  const { vin } = request;
  request.systemNumber = systemNumber;
  request.createdTimestamp = new Date().toISOString();
  request.partialVin = vin.length < 6 ? vin : vin.substring(request.vin.length - 6);
  return request;
};
