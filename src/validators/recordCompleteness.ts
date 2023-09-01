import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import {
  HttpMethod, RecordCompleteness,
  VehicleTypeWithSmallTrl,
} from '../util/enum';
import logger from '../util/logger';
import { identifySchema } from './schemaIdentifier';

/**
 * This function validates and changes the input in place and returns the RecordCompleteness.
 * @param input: TechRecordPut | TechRecordGet
 * @returns RecordCompleteness
 *
 */
export function validateAndComputeRecordCompleteness(input: (TechRecordType<'put'> | TechRecordType<'get'>), method: HttpMethod): RecordCompleteness {
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

const validateSkeletonSchema = (input: (TechRecordType<'put'> | TechRecordType<'get'>), method: HttpMethod): boolean => {
  const vehicleTypeWithSmallTrl = getVehicleTypeWithSmallTrl(input);

  if (!vehicleTypeWithSmallTrl) {
    return false;
  }
  const isSkeletonSchema = identifySchema(vehicleTypeWithSmallTrl, RecordCompleteness.SKELETON, method);
  if (!isSkeletonSchema) {
    return false;
  }

  const errors = isValidObject(isSkeletonSchema, input, true);
  if (errors.length) {
    logger.info(`Is not a valid skeleton schema, errors: ${JSON.stringify(errors)}`);
  }
  return !errors.length;
};

const validateCompleteSchema = (input: (TechRecordType<'get'> | TechRecordType<'put'>), method: HttpMethod): boolean => {
  const vehicleTypeWithSmallTrl = getVehicleTypeWithSmallTrl(input);

  if (!vehicleTypeWithSmallTrl) {
    return false;
  }
  const isCompleteSchema = identifySchema(vehicleTypeWithSmallTrl, RecordCompleteness.COMPLETE, method);
  if (!isCompleteSchema) {
    return false;
  }

  const errors = isValidObject(isCompleteSchema, input, true);
  if (errors.length) {
    logger.info(`Is not a valid complete schema, errors: ${JSON.stringify(errors)}`);
  }
  return !errors.length;
};

const validateTestableSchema = (input: (TechRecordType<'get'> | TechRecordType<'put'>), method: HttpMethod): boolean => {
  const vehicleTypeWithSmallTrl = getVehicleTypeWithSmallTrl(input);

  if (!vehicleTypeWithSmallTrl) {
    return false;
  }

  const isTestableSchema = identifySchema(vehicleTypeWithSmallTrl, RecordCompleteness.TESTABLE, method);
  if (!isTestableSchema) {
    return false;
  }

  const errors = isValidObject(isTestableSchema, input, true, true);
  if (errors.length) {
    logger.info(`Is not a valid testable schema, errors: ${JSON.stringify(errors)}`);
  }
  return !errors.length;
};

export const getVehicleTypeWithSmallTrl = (record: TechRecordType<'get'> | TechRecordType<'put'>): VehicleTypeWithSmallTrl | undefined => (
  record.techRecord_vehicleType === 'trl'
  && (record.techRecord_euVehicleCategory === 'o1' || record.techRecord_euVehicleCategory === 'o2')
    ? 'small trl'
    : record.techRecord_vehicleType

);
