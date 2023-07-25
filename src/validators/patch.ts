import { APIGatewayProxyEvent } from 'aws-lambda';
import { TechrecordGet } from '../models/post';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

// eslint-disable-next-line consistent-return
export const validateUpdateVinRequest = (event: APIGatewayProxyEvent) => {
  const isPathInvalid = validateSysNumTimestampPathParams(event);

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
};

// eslint-disable-next-line consistent-return
export const validateVins = (currentRecord: TechrecordGet, newVin: string) => {
  if (
    !newVin
    || newVin.length < 3
    || newVin.length > 21
    || !(/^[0-9a-z]+$/i).test(newVin)
    || typeof newVin !== 'string'
  ) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'New VIN is invalid',
    });
  } if (newVin === currentRecord.vin) {
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(currentRecord)),
    });
  }
};
