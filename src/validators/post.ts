import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { schemas } from '@dvsa/cvs-type-definitions/schemas';
import { ErrorObject } from 'ajv';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { TechRecordGet, TechRecordPut } from '../models/post';
import {
  ERRORS, HttpMethod, RecordCompleteness, VehicleType,
} from '../util/enum';

export const identifyObjectType = (obj: TechRecordGet, method: HttpMethod) => identifySchema(obj.techRecord_vehicleType as VehicleType, obj.techRecord_recordCompleteness as RecordCompleteness, method);
export const identifySchema = (vehicleType: VehicleType, recordCompleteness: RecordCompleteness, method: HttpMethod) => schemas
  .find((x: string) => x.includes(vehicleType) && x.includes(recordCompleteness) && x.includes(method));

export const formatValidationErrors = (errors: ErrorObject[]) => {
  const errorMessage: string[] = [];
  errors.forEach((element) => {
    if (element.message) {
      errorMessage.push(`${element.instancePath} ${element.message}`);
    }
  });
  return JSON.stringify({ error: errorMessage });
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
  const body = JSON.parse(event.body) as TechRecordPut;

  if (!body.techRecord_vehicleType) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.VEHICLE_TYPE_ERROR }),
    };
  }

  const schema = identifySchema(body.techRecord_vehicleType as VehicleType, RecordCompleteness.SKELETON, HttpMethod.PUT);

  if (!schema) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Payload is invalid' }),
    };
  }
  const validations = isValidObject(schema, body, true);
  if (Array.isArray(validations)) {
    const errors = formatValidationErrors(validations);
    return {
      statusCode: 400,
      body: errors,
    };
  }
  return undefined;
};
