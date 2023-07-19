import { APIGatewayProxyEvent } from 'aws-lambda';
import { addHttpHeaders } from '../util/httpHeaders';
import { TechrecordGet } from '../models/post';
import { formatTechRecord } from '../util/formatTechRecord';

export function validateUpdateVinRequest(event: APIGatewayProxyEvent) {
  if (!event.body) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ error: 'invalid request' }),
    });
  }

  if (!event.headers.Authorization) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization header' }),
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newVin: string = JSON.parse(event.body).newVin as string;

  if (!newVin) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ error: 'You must provide a new VIN' }),
    });
  }
  return undefined;
}

export function validateVins(currentRecord: TechrecordGet, newVin: string) {
  if (
    !newVin
    || newVin.length < 3
    || newVin.length > 21
    || typeof newVin !== 'string'
  ) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify({ error: 'New VIN is invalid' }),
    });
  }
  if (newVin === currentRecord.vin) {
    const formattedRecord = formatTechRecord(currentRecord)
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formattedRecord),
    });
  }
  return undefined;
}
