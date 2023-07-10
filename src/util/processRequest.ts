/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import logger from './logger';
import { generateNewNumber, NumberTypes } from '../services/testNumber';
import { computeRecordCompleteness } from './recordCompleteness';

export const processRequest = async (request: any) => {
  logger.info('processing request');
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
  request.techRecord_recordCompleteness = computeRecordCompleteness(request) ?? '';
  logger.info('successfully processed record');
  return request;
};
