import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { TechRecordGet, TechRecordPut } from '../models/post';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';
import logger from '../util/logger';
import { identifySchema } from './post';

/**
 * This function validates and changes the input in place and returns the RecordCompleteness.
 * @param input: TechRecordPut | TechRecordGet
 * @returns RecordCompleteness
 *
 */
export function validateAndComputeRecordCompleteness(input: (TechRecordPut | TechRecordGet), method: HttpMethod): RecordCompleteness {
  if (input.techRecord_hiddenInVta) {
    logger.info('Hidden in VTA, returning skeleton');
    validateSkeletonSchema(input, method);
    return RecordCompleteness.SKELETON;
  }
  if (validateCompleteSchema(input, method)) {
    return RecordCompleteness.COMPLETE;
  }
  if (validateTestableSchema(input, method)) {
    return RecordCompleteness.TESTABLE;
  }
  validateSkeletonSchema(input, method);
  return RecordCompleteness.SKELETON;
}

const validateSkeletonSchema = (input: (TechRecordPut | TechRecordGet), method: HttpMethod): boolean => {
  const isSkeletonSchema = identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.SKELETON, method);
  return isSkeletonSchema ? isValidObject(isSkeletonSchema, input) : false;
};

const validateCompleteSchema = (input: (TechRecordPut | TechRecordGet), method: HttpMethod): boolean => {
  const isCompleteSchema = identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.COMPLETE, method);
  return isCompleteSchema ? isValidObject(isCompleteSchema, input) : false;
};

const validateTestableSchema = (input: (TechRecordPut | TechRecordGet), method: HttpMethod): boolean => {
  const isTestableSchema = input.techRecord_vehicleType === (VehicleType.TRL || VehicleType.PSV || VehicleType.HGV)
    ? identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.TESTABLE, method) : '';
  return isTestableSchema ? isValidObject(isTestableSchema, input) : false;
};
