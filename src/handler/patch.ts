import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import { TechrecordGet } from '../models/post';
import { processPatchVinRequest } from '../processors/processPatchVinRequest';
import {
  archiveOldCreateCurrentRecord,
  getBySystemNumberAndCreatedTimestamp,
} from '../services/database';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateUpdateVinRequest, validateVins } from '../validators/patch';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Amend VIN Called');

  const isRequestInvalid: APIGatewayProxyResult | undefined = validateUpdateVinRequest(event);

  if (isRequestInvalid) {
    return isRequestInvalid;
  }

  logger.debug('Request is Valid');

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newVin: string = JSON.parse(event.body ?? '').newVin as string ?? '';

  const currentRecord: TechrecordGet = await getBySystemNumberAndCreatedTimestamp(
    systemNumber,
    createdTimestamp,
  ) as TechrecordGet;

  const isVinInvalid: APIGatewayProxyResult | undefined = validateVins(currentRecord, newVin.toUpperCase());

  if (isVinInvalid) {
    return isVinInvalid;
  }

  logger.debug("Vin's have been validated");

  const [recordToArchive, newRecord] = processPatchVinRequest(
    currentRecord,
    event,
  );

  try {
    await archiveOldCreateCurrentRecord(
      [recordToArchive],
      newRecord,
    );

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(newRecord)),
    });
  } catch (error) {
    return addHttpHeaders({
      statusCode: 500,
      body: JSON.stringify(error),
    });
  }
};
