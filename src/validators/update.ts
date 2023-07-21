import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  TechrecordCar, TechrecordGet, TechrecordHgv, TechrecordMotorcycle, TechrecordPsv, TechrecordTrl,
} from '../models/post';
import { ERRORS, STATUS } from '../util/enum';

export const validateUpdateErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  if (!event.pathParameters?.systemNumber) {
    return {
      statusCode: 400,
      body: 'Missing system number',
    };
  }

  if (!event.pathParameters?.createdTimestamp) {
    return {
      statusCode: 400,
      body: 'Missing created timestamp',
    };
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters.systemNumber);
  if (systemNumber.length < 3 || systemNumber.length > 21) {
    return {
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    };
  }

  const createdTimestamp = decodeURIComponent(event.pathParameters.createdTimestamp);
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{0,20}Z/i.test(createdTimestamp)) {
    return {
      statusCode: 400,
      body: 'Invalid created timestamp',
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: ERRORS.MISSING_PAYLOAD,
    };
  }

  const techRec = JSON.parse(event.body) as TechrecordGet;

  if (techRec.vin || techRec.partialVin) {
    return {
      statusCode: 400,
      body: 'Cannot update VIN through this endpoint',
    };
  }

  if ((techRec as TechrecordHgv | TechrecordMotorcycle | TechrecordCar | TechrecordPsv).primaryVrm) {
    return {
      statusCode: 400,
      body: 'Cannot update VRM through this endpoint',
    };
  }

  if ((techRec as TechrecordTrl).trailerId) {
    return {
      statusCode: 400,
      body: 'Cannot update TrailerID through this endpoint',
    };
  }

  return undefined;
};

export const checkStatusCodeValidity = (oldStatus: string | undefined, newStatus?: string | undefined): APIGatewayProxyResult | undefined => {
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
  return undefined;
};
