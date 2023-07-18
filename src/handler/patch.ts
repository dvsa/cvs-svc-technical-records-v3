import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import {
  archiveOldCreateCurrentRecord,
  getBySystemNumberAndCreatedTimestamp,
} from '../services/database';
import { validateUpdateVinRequest, validateVins } from '../validators/patch';
import { PatchRequestRecords } from '../processors/processPatchVinRequest';
import { TechrecordGet } from '../models/post';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Patch Technical Record Called');

  const isRequestInvalid = validateUpdateVinRequest(event);

  if (isRequestInvalid) {
    return isRequestInvalid;
  }

  logger.info('Request is Valid');

  const systemNumber: string = decodeURIComponent(
    event.pathParameters?.systemNumber as string,
  );
  const createdTimestamp: string = decodeURIComponent(
    event.pathParameters?.createdTimestamp as string,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newVin: string = JSON.parse(event.body!).newVin! as string;

  const currentRecord: TechrecordGet = await getBySystemNumberAndCreatedTimestamp(
    systemNumber,
    createdTimestamp,
  ) as TechrecordGet;

  const isVinInvalid = validateVins(currentRecord.vin, newVin.toUpperCase());

  if (isVinInvalid) {
    return isVinInvalid;
  }

  logger.info("Vin's have been validated");

  const patchRecords: PatchRequestRecords = new PatchRequestRecords(
    currentRecord,
    event,
  );

  try {
    const patchRequest: string = await archiveOldCreateCurrentRecord(
      patchRecords.recordToArchive,
      patchRecords.newRecord,
    ) as string;

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(patchRequest),
    });
  } catch (error) {
    return addHttpHeaders({ statusCode: 500, body: JSON.stringify(error) });
  }
};
