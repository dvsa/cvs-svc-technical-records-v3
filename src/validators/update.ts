import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { SearchCriteria } from '../models/search';
import { UpdateVrmRequestBody } from '../models/updateVrm';
import { searchByCriteria } from '../services/database';
import {
  ERRORS, StatusCode,
} from '../util/enum';
import { formatErrorMessage } from '../util/errorMessage';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import { isObjectEmpty } from './emptyObject';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validateUpdateErrors = (requestBody: string | null) => {
  if (!requestBody || isObjectEmpty(JSON.parse(requestBody))) {
    return {
      statusCode: 400,
      body: formatErrorMessage(ERRORS.MISSING_PAYLOAD),
    };
  }
  return false;
};

export const checkStatusCodeValidity = (oldStatus: string | undefined | null, newStatus?: string | undefined | null) => {
  if (oldStatus === StatusCode.ARCHIVED) {
    return {
      statusCode: 400,
      body: formatErrorMessage(ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD),
    };
  }
  if (newStatus === StatusCode.ARCHIVED) {
    return {
      statusCode: 400,
      body: formatErrorMessage(ERRORS.CANNOT_USE_UPDATE_TO_ARCHIVE),
    };
  }
  return false;
};

export const validateUpdateVrmRequest = (event: APIGatewayProxyEvent) => {
  const isPathInvalid = validateSysNumTimestampPathParams(event);
  if (isPathInvalid) {
    return isPathInvalid;
  }

  if (!event.headers.Authorization) {
    return {
      statusCode: 400,
      body: formatErrorMessage('Missing authorization header'),
    };
  }

  if (!event.body || !Object.keys(event.body).length) {
    return {
      statusCode: 400,
      body: formatErrorMessage('invalid request'),
    };
  }

  const { newVrm } = JSON.parse(event.body) as UpdateVrmRequestBody;

  if (!newVrm) {
    return {
      statusCode: 400,
      body: formatErrorMessage('You must provide a new VRM'),
    };
  }

  return false;
};

// eslint-disable-next-line consistent-return
export const validateVrm = (currentRecord: TechRecordType<'get'>, newVrm: string) => {
  if (!newVrm) {
    return {
      statusCode: 400,
      body: formatErrorMessage('New Identifier is invalid'),
    };
  }
  if (!(/^[0-9a-z]+$/i).test(newVrm)) {
    return {
      statusCode: 400,
      body: formatErrorMessage('Invalid VRM'),
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
      body: formatErrorMessage('Cannot update the vrm of an archived record'),
    };
  }
  return false;
};

export const validateVrmExists = async (vrm: string) => {
  const techRecords = await searchByCriteria(SearchCriteria.PRIMARYVRM, vrm);
  const vrmExists = techRecords.find((x) => x.primaryVrm === vrm && x.techRecord_statusCode !== StatusCode.ARCHIVED);
  if (vrmExists) {
    return addHttpHeaders({
      statusCode: 400,
      body: formatErrorMessage(`Primary VRM ${vrm} already exists`),
    });
  }
  return false;
};
