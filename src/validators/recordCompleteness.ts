import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { TechrecordPut } from '../models/post';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';
import logger from '../util/logger';
import { identifySchema } from './post';

/**
 * This function validates and changes the input in place and also returns the RecordCompleteness.
 * @param input: TechrecordPut
 * @returns RecordCompleteness
 *
 */
export function validateAndComputeRecordCompleteness(input: TechrecordPut): RecordCompleteness {
  if (input.techRecord_hiddenInVta) {
    logger.info('Hidden in VTA, returning skeleton');
    validateSkeletonSchema(input);
    return RecordCompleteness.SKELETON;
  }
  if (validateCompleteSchema(input)) {
    return RecordCompleteness.COMPLETE;
  }
  if (validateTestableSchema(input)) {
    return RecordCompleteness.TESTABLE;
  }
  validateSkeletonSchema(input);
  return RecordCompleteness.SKELETON;
}

const validateSkeletonSchema = (input: TechrecordPut): boolean => {
  const isSkeletonSchema = identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.SKELETON, HttpMethod.PUT);
  if (isSkeletonSchema) {
    return isValidObject(isSkeletonSchema, input);
  }
  return false;
};

const validateCompleteSchema = (input: TechrecordPut): boolean => {
  const isCompleteSchema = identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.COMPLETE, HttpMethod.PUT);
  if (isCompleteSchema) {
    if (isValidObject(isCompleteSchema, input)) return true;
  }
  return false;
};
const validateTestableSchema = (input: TechrecordPut): boolean => {
  const isTestableSchema = input.techRecord_vehicleType === (VehicleType.TRL || VehicleType.PSV || VehicleType.HGV)
    ? identifySchema(input.techRecord_vehicleType as VehicleType, RecordCompleteness.TESTABLE, HttpMethod.PUT) : '';
  if (isTestableSchema) {
    if (isValidObject(isTestableSchema, input)) return true;
  }
  return false;
};
