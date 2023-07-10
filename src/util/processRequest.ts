/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import logger from './logger';
import { generateNewNumber, NumberTypes } from '../services/testNumber';
import { identifySchema } from '../validators/post';
import {isValidObject} from "@dvsa/cvs-type-definitions/lib/src/schema-validation/schema-validator";

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

export function computeRecordCompleteness(input: any) {
  const generalVehicleErrors = generalErrors(input);
  if (generalVehicleErrors) {
    logger.info('general errors: ', generalVehicleErrors);
    return 'skeleton';
  }
  logger.info(input);
  logger.info('yrdy');
  logger.info(input.techRecord_vehicleType, 'complete', 'put');
  let isCompleteSchema = identifySchema(input.techRecord_vehicleType, 'complete', 'put');
logger.info('is complete schema ' + isCompleteSchema[0]);
  let isTestableSchema = identifySchema(input.techRecord_vehicleType, 'testable', 'put');
  logger.info('is testable schema ' + isTestableSchema[0]);
  let isSkeletonSchema = identifySchema(input.techRecord_vehicleType, 'skeleton', 'put');
  logger.info('is skeleton schema ' + isSkeletonSchema[0]);
  const isComplete = isValidObject(isCompleteSchema[0], input);
  const isTestable = isValidObject(isTestableSchema[0], input);
  const isSkeleton = isValidObject(isSkeletonSchema[0], input);
  console.log(`is complete?: ${isComplete}`);
  console.log(`is testable?: ${isTestable}`);
  console.log(`is skeleton? ${isSkeleton}`);
  if (isComplete) {
    logger.info(`returning complete`);
    return 'complete';
  }
  if (isTestable) {
    logger.info(`returning testable`);
    return 'testable';
  }
  if (isSkeleton) {
    logger.info(`returning skeleton`);
    return 'skeleton';
  }
  return '';
}

const generalErrors = (input: any) => {
  if (!input.techRecord_vehicleType) {
    return 'Missing vehicle type';
  }
  if (!input.systemNumber) {
    throw new Error('System Number generation failed');
  }
  if (input.techRecord_hiddenInVta) {
    return 'skeleton';
  }
  return '';
};
