import { APIGatewayProxyEvent } from 'aws-lambda';
import { ERRORS, STATUS } from '../util/enum';
import { isObjectEmpty } from './emptyObject';
import { formatTechRecord } from '../util/formatTechRecord';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';
import { TechrecordGet } from '../models/post';
import { UpdateVrmRequestBody } from '../models/updateVrm';

export const validateUpdateErrors = (requestBody: string | null) => {
  if (!requestBody || isObjectEmpty(JSON.parse(requestBody))) {
    return {
      statusCode: 400,
      body: ERRORS.MISSING_PAYLOAD,
    };
  }

  return false;
};

export const checkStatusCodeValidity = (oldStatus: string | undefined, newStatus?: string | undefined) => {
  if (oldStatus === STATUS.ARCHIVED) {
    return {
      statusCode: 400,
      body: ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD,
    };
  }
  if (newStatus === STATUS.ARCHIVED) {
    return {
      statusCode: 400,
      body: ERRORS.CANNOT_USE_UPDATE_TO_ARCHIVE,
    };
  }
  // TODO: check this criteria
  if (oldStatus === STATUS.CURRENT && newStatus === STATUS.PROVISIONAL) {
    return {
      statusCode: 400,
      body: ERRORS.CANNOT_CHANGE_CURRENT_TO_PROVISIONAL,
    };
  }
  return false;
};

export const checkVinValidity = (currentVin: string, newVin: (string | undefined | null)) => {
  if ((newVin !== undefined && newVin !== null) && newVin !== currentVin) {
    if (newVin.length < 3
      || newVin.length > 21
      || typeof newVin !== 'string'
      || !(/^[0-9a-z]+$/i).test(newVin)
    ) {
      return ({
        statusCode: 400,
        body: ERRORS.VIN_ERROR,
      });
    }
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
export const validateVrm = (currentRecord: TechrecordGet, newVrm: string) => {
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
