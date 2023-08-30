import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { ErrorObject } from 'ajv';
import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  ERRORS, HttpMethod, RecordCompleteness,
} from '../util/enum';
import logger from '../util/logger';
import { getVehicleTypeWithSmallTrl } from './recordCompleteness';
import { identifySchema } from './schemaIdentifier';

export const formatValidationErrors = (errors: ErrorObject[]) => {
  const errorMessage: string[] = [];
  errors.forEach((element) => {
    if (element.message) {
      const error = element.instancePath ? `${element.instancePath.substring(1)} ${element.message}` : `${element.message}`;
      errorMessage.push(error);
    }
  });
  return JSON.stringify({ error: errorMessage });
};

export const validateAgainstSkeletonSchema = (body: TechRecordType<'put'>) => {
  const vehicleTypeWithSmallTrl = getVehicleTypeWithSmallTrl(body);
  if (!vehicleTypeWithSmallTrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Vehicle type is required' }),
    };
  }
  const schema = identifySchema(vehicleTypeWithSmallTrl, RecordCompleteness.SKELETON, HttpMethod.PUT);
  logger.debug(`Validating against schema: ${schema ?? 'Could not find schema'}`);

  if (!schema) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Payload is invalid' }),
    };
  }
  const validationErrors = isValidObject(schema, body, true);
  if (validationErrors.length) {
    const errors = formatValidationErrors(validationErrors);
    return {
      statusCode: 400,
      body: errors,
    };
  }
  return undefined;
};

export const validatePostErrors = (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.MISSING_PAYLOAD }),
    };
  }
  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.MISSING_AUTH_HEADER }),
    };
  }
  const body = JSON.parse(event.body) as TechRecordType<'put'>;

  if (!body.techRecord_vehicleType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.VEHICLE_TYPE_ERROR }),
    };
  }

  return validateAgainstSkeletonSchema(body);
};
