/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import logger from '../util/logger';
import { generateNewNumber, NumberTypes } from '../services/testNumber';
import { identifySchema } from '../validators/post';
import { UserDetails } from '../services/user';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';
import {
  TechrecordCar,
  TechrecordGet,
  TechrecordHgv,
  TechrecordMotorcycle,
  TechrecordPsv,
  TechrecordPut, TechrecordTrl,
} from '../models/post';

export const processPostRequest = async (input: unknown, userDetails: UserDetails): TechRecordGet => {
  // we should be validating it's a valid technical record HERE.)
  if (isObjectEmpty(input)) {
    throw new Error('Invalid Technical Record');
  }
  const request: TechrecordPut = await flattenArrays(input) as TechrecordPut;
  logger.info('processing request');
  (request as TechrecordGet).techRecord_recordCompleteness = computeRecordCompleteness(request);
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  if (request.techRecord_vehicleType !== 'trl' && !request.primaryVrm) {
    (request as (TechrecordPsv | TechrecordCar | TechrecordHgv | TechrecordMotorcycle)).primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId && (request.techRecord_euVehicleCategory === 'o1' || request.techRecord_euVehicleCategory === 'o2')) {
    (request as TechrecordTrl).trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId) {
    (request as TechrecordTrl).trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  (request as TechrecordGet).systemNumber = systemNumber;
  (request as TechrecordGet).createdTimestamp = new Date().toISOString();
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
  const isCompleteSchema = identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.COMPLETE, HttpMethod.PUT);
  let isComplete;
  if (isCompleteSchema) {
    isComplete = isValidObject(isCompleteSchema, input);
  }
  const isTestableSchema = input.techRecord_vehicleType === (VehicleType.TRL || VehicleType.PSV || VehicleType.HGV)
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
  if (!input.techRecord_vehicleType) {
    return 'Missing vehicle type';
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if ((input as any).techRecord_hiddenInVta) {
    return 'skeleton';
  }
  return '';
};
async function flattenArrays<T>(input: T): Promise<T> {
  const flattenArray = (obj: any, path: string): any => {
    if (Array.isArray(obj)) {
      return obj.reduce((acc: any, curr: any, index: number) => {
        const key = path ? `${path}_${index}` : `${index}`;
        return {
          ...acc,
          ...flattenArray(curr, key),
        };
      }, {});
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).reduce((acc: any, [key, value]: [string, any]) => {
        const newPath = path ? `${path}_${key}` : key;
        return {
          ...acc,
          ...flattenArray(value, newPath),
        };
      }, {});
    }

    return { [path]: obj };
  };
  return Promise.resolve(flattenArray(input, ''));
}

const isObjectEmpty = (input: unknown) => (typeof input === 'object' && input !== null ? !Object.keys(input).length : false);
