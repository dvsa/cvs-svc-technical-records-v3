import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { TechRecordPut } from '../models/post';
import {
  ERRORS, HttpMethod, RecordCompleteness, StatusCode, VehicleType,
} from '../util/enum';
import { isObjectEmpty } from './emptyObject';
import { identifySchema } from './post';

export const validateUpdateErrors = (requestBody: string | null) => {
  if (!requestBody || isObjectEmpty(JSON.parse(requestBody))) {
    return {
      statusCode: 400,
      body: ERRORS.MISSING_PAYLOAD,
    };
  }

  const body = JSON.parse(requestBody ?? '') as TechRecordPut;

  const schema = identifySchema(body.techRecord_vehicleType as VehicleType, RecordCompleteness.SKELETON, HttpMethod.PUT);

  if (!schema || !isValidObject(schema, body)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Payload is invalid' }),
    };
  }

  return false;
};

export const checkStatusCodeValidity = (oldStatus: string | undefined, newStatus?: string | undefined) => {
  if (oldStatus === StatusCode.ARCHIVED) {
    return {
      statusCode: 400,
      body: ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD,
    };
  }
  if (newStatus === StatusCode.ARCHIVED) {
    return {
      statusCode: 400,
      body: ERRORS.CANNOT_USE_UPDATE_TO_ARCHIVE,
    };
  }
  // TODO: check this criteria
  if (oldStatus === StatusCode.CURRENT && newStatus === StatusCode.PROVISIONAL) {
    return {
      statusCode: 400,
      body: ERRORS.CANNOT_CHANGE_CURRENT_TO_PROVISIONAL,
    };
  }
  return false;
};
