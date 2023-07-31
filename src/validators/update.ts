import { isValidObject } from '@dvsa/cvs-type-definitions/schema-validator';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { TechRecordGet, TechRecordPut } from '../models/post';
import { UpdateVrmRequestBody } from '../models/updateVrm';
import {
  ERRORS, HttpMethod, RecordCompleteness, StatusCode, VehicleType,
} from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { isObjectEmpty } from './emptyObject';
import { identifySchema } from './post';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

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
  return false;
};

export const validateUpdateVrmRequest = (event: APIGatewayProxyEvent) => {
  const isPathInvalid = validateSysNumTimestampPathParams(event);
  if (isPathInvalid) {
    return isPathInvalid;
  }
  if (!event.body || !Object.keys(event.body).length) {
    return {
      statusCode: 400,
      body: 'invalid request',
    };
  }

  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: 'Missing authorization header',
    };
  }
  const { newVrm } = JSON.parse(event.body) as UpdateVrmRequestBody;
  if (!newVrm) {
    return {
      statusCode: 400,
      body: 'You must provide a new VRM',
    };
  }
  return false;
};

// eslint-disable-next-line consistent-return
export const validateVrm = (currentRecord: TechRecordGet, newVrm: string) => {
  if (!newVrm) {
    return {
      statusCode: 400,
      body: 'New Identifier is invalid',
    };
  }
  if (!(/^[0-9a-z]+$/i).test(newVrm)) {
    return {
      statusCode: 400,
      body: 'Invalid VRM',
    };
  }
  if ('primaryVrm' in currentRecord && newVrm === currentRecord.primaryVrm) {
    return {
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(currentRecord)),
    };
  }
  if (currentRecord.techRecord_statusCode === 'archived') {
    return {
      statusCode: 400,
      body: 'Cannot update the vrm of an archived record',
    };
  }
  return false;
};
