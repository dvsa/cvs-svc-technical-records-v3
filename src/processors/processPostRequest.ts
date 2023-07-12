import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import logger from '../util/logger';
import { generateNewNumber, NumberTypes } from '../services/testNumber';
import { identifySchema } from '../validators/post';
import { UserDetails } from '../services/user';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';
import { TechrecordGet, TechrecordPut } from '../models/post';

export const processPostRequest = async (input: unknown, userDetails: UserDetails) => {
  // we should be validating it's a valid technical record HERE.
  const request: TechrecordPut = await flattenArrays(input) as TechrecordPut;
  logger.info('processing request');
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  if (request.techRecord_vehicleType !== 'trl' && !request.primaryVrm) {
    request.primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId && (request.techRecord_euVehicleCategory === 'o1' || request.techRecord_euVehicleCategory === 'o2')) {
    request.trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId) {
    request.trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  if ('techRecord_recordCompleteness' in request) {
    request.techRecord_recordCompleteness = computeRecordCompleteness(request);
  }
  if ('systemNumber' in request) {
    request.systemNumber = systemNumber;
  }
  if ('createdTimestamp' in request) {
    request.createdTimestamp = new Date().toISOString();
  }
  if ('vin' in request && request.vin) {
    request.partialVin = request.vin.length < 6 ? request.vin : request.vin.substring(request.vin.length - 6);
  }
  if ('techRecord_createdByName' in request) {
    request.techRecord_createdByName = userDetails.username;
  }
  if ('techRecord_createdById' in request) {
    request.techRecord_createdById = userDetails.msOid;
  }
  logger.info('successfully processed record');
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...acc,
          ...flattenArray(curr, key),
        };
      }, {});
    }

    if (typeof obj === 'object' && obj !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return Object.entries(obj).reduce((acc: any, [key, value]: [string, any]) => {
        const newPath = path ? `${path}_${key}` : key;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...acc,
          ...flattenArray(value, newPath),
        };
      }, {});
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { [path]: obj };
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Promise.resolve(flattenArray(input, ''));
}
