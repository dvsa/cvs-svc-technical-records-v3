import {
  TechrecordCar, TechrecordGet, TechrecordHgv, TechrecordMotorcycle, TechrecordPsv, TechrecordTrl,
} from '../models/post';
import { ERRORS, STATUS } from '../util/enum';

export const validateUpdateErrors = (requestBody: string | null) => {
  if (!requestBody) {
    return {
      statusCode: 400,
      body: ERRORS.MISSING_PAYLOAD,
    };
  }

  const techRec = JSON.parse(requestBody) as TechrecordGet;

  if (techRec.vin || techRec.partialVin) {
    return {
      statusCode: 400,
      body: ERRORS.INVALID_VIN_UPDATE,
    };
  }

  if ((techRec as TechrecordHgv | TechrecordMotorcycle | TechrecordCar | TechrecordPsv).primaryVrm) {
    return {
      statusCode: 400,
      body: ERRORS.INVALID_VRM_UPDATE,
    };
  }

  if ((techRec as TechrecordTrl).trailerId) {
    return {
      statusCode: 400,
      body: ERRORS.INVALID_TRAILER_ID_UPDATE,
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
