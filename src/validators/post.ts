import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { schemas } from '@dvsa/cvs-type-definitions/schemas';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { ErrorObject } from 'ajv';
import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  ERRORS, HttpMethod, RecordCompleteness, VehicleType,
} from '../util/enum';

export const identifySchema = (vehicleType: VehicleType, recordCompleteness: RecordCompleteness, method: HttpMethod) => schemas
  .find((x: string) => x.includes(vehicleType) && x.includes(recordCompleteness) && x.includes(method));

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
  const schema = identifySchema(body.techRecord_vehicleType as VehicleType, RecordCompleteness.SKELETON, HttpMethod.PUT);

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
