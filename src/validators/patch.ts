import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addHttpHeaders } from '../util/httpHeaders';
import { TechrecordGet } from '../models/post';
import { formatTechRecord } from '../util/formatTechRecord';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validateUpdateVinRequest = (event: APIGatewayProxyEvent) => {
  const isPathInvalid: APIGatewayProxyResult | undefined = validateSysNumTimestampPathParams(event);

  if (isPathInvalid) {
    return isPathInvalid;
  }

  if (!event.body || !Object.keys(event.body).length) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'invalid request',
    });
  }

  if (!event.headers.Authorization) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Missing authorization header',
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newVin: string = JSON.parse(event.body).newVin as string;

  if (!newVin) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'You must provide a new VIN',
    });
  }
  return undefined;
};

export const validateVins = (currentRecord: TechrecordGet, newVin: string) => {
  if (
    !newVin
    || newVin.length < 3
    || newVin.length > 21
    || typeof newVin !== 'string'
  ) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'New VIN is invalid',
    });
  }
  if (newVin === currentRecord.vin) {
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(currentRecord)),
    });
  }
  return undefined;
};
