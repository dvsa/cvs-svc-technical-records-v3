import { ERRORS, STATUS } from '../util/enum';
import { isObjectEmpty } from './emptyObject';
import {formatTechRecord} from "../util/formatTechRecord";
import {validateSysNumTimestampPathParams} from "./sysNumTimestamp";
import {APIGatewayProxyEvent} from "aws-lambda";

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

// eslint-disable-next-line consistent-return
export const validateUpdateVrmRequest = (event: APIGatewayProxyEvent) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
  const isPathInvalid = validateSysNumTimestampPathParams(event);

  if (isPathInvalid) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newIdentifier: string = JSON.parse(event.body).newIdentifier as string;

  if (!newIdentifier) {
    return {
      statusCode: 400,
      body: 'You must provide a new VRM',
    };
  }
};
// eslint-disable-next-line consistent-return
export const validateVrm = (currentRecord: any, newIdentifier: string) => {
  if (!newIdentifier) {
    return {
      statusCode: 400,
      body: 'New Identifier is invalid',
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if ((newIdentifier === currentRecord.primaryVrm || newIdentifier === currentRecord.trailerId) && currentRecord.techRecord_statusCode !== 'archived') {
    return {
      statusCode: 200,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      body: JSON.stringify(formatTechRecord(currentRecord)),
    };
  }
};
// eslint-disable-next-line consistent-return
export const validateTrailerId = (currentRecord: any, trailerId: string) => {
  if (!trailerId) {
    return {
      statusCode: 400,
      body: 'New Trailer id is invalid',
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (trailerId === currentRecord.trailerId && currentRecord.techRecord_statusCode !== 'archived') {
    return {
      statusCode: 200,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      body: JSON.stringify(formatTechRecord(currentRecord)),
    };
  }
};
