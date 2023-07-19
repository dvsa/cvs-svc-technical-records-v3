/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import {
  TechrecordCar,
  TechrecordGet,
  TechrecordHgv,
  TechrecordMotorcycle,
  TechrecordPut, TechrecordTrl,
} from '../models/post';
import { generateNewNumber, NumberTypes } from '../services/testNumber';
import { UserDetails } from '../services/user';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';
import logger from '../util/logger';
import { identifySchema } from '../validators/post';
import { flattenArrays } from '../util/formatTechRecord';

export const processPostRequest = async (input: unknown, userDetails: UserDetails): Promise<TechrecordGet> => {
  // we should be validating it's a valid technical record HERE.)
  if (isObjectEmpty(input)) {
    throw new Error('Invalid Technical Record');
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const request: TechrecordPut = await flattenArrays(input) as TechrecordPut;
  logger.info('processing request');
  (request as TechrecordGet).techRecord_recordCompleteness = computeRecordCompleteness(request);
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (request.techRecord_vehicleType !== 'trl' && !request.primaryVrm) {
    (request as TechrecordHgv | TechrecordMotorcycle | TechrecordCar).primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId && (request.techRecord_euVehicleCategory === 'o1' || request.techRecord_euVehicleCategory === 'o2')) {
    (request as TechrecordTrl).trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId) {
    (request as TechrecordTrl).trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  (request as TechrecordGet).systemNumber = systemNumber;
  (request as TechrecordGet).createdTimestamp = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  (request as TechrecordGet).partialVin = request.vin.length < 6 ? request.vin : request.vin.substring(request.vin.length - 6);
  (request as TechrecordGet).techRecord_createdByName = userDetails.username;
  (request as TechrecordGet).techRecord_createdById = userDetails.msOid;
  logger.info('Successfully Processed Record');
  return request as TechrecordGet;
};

export function computeRecordCompleteness(input: TechrecordPut): RecordCompleteness {
  const generalVehicleErrors = generalErrors(input);
  if (generalVehicleErrors) {
    logger.info('general errors: ', generalVehicleErrors);
    return RecordCompleteness.SKELETON;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const isCompleteSchema = identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.COMPLETE, HttpMethod.PUT);
  let isComplete;
  if (isCompleteSchema) {
    isComplete = isValidObject(isCompleteSchema, input);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const isTestableSchema = input.techRecord_vehicleType === (VehicleType.TRL || VehicleType.PSV || VehicleType.HGV)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ? identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.TESTABLE, HttpMethod.PUT) : '';
  let isTestable = false;
  if (isTestableSchema) {
    isTestable = isValidObject(isTestableSchema, input);
  }
  if (isComplete) {
    logger.info('returning complete');
    return RecordCompleteness.COMPLETE;
  }
  if (isTestable) {
    logger.info('returning testable');
    return RecordCompleteness.TESTABLE;
  }
  return RecordCompleteness.SKELETON;
}

const generalErrors = (input: TechrecordPut) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!input.techRecord_vehicleType) {
    return 'Missing vehicle type';
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-type-assertion
  if ((input as any).techRecord_hiddenInVta) {
    return 'skeleton';
  }
  return '';
};

const isObjectEmpty = (input: unknown) => (typeof input === 'object' && input !== null ? !Object.keys(input).length : false);
