import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import {
  archiveOldCreateCurrentRecord,
  getBySystemNumberAndCreatedTimestamp,
} from '../services/database';
import { validateUpdateVinRequest, validateVins } from '../validators/patch';
import { processPatchVinRequest } from '../processors/processPatchVinRequest';
import { TechrecordGet } from '../models/post';
import { formatTechRecord } from '../util/formatTechRecord';
import { getUserDetails } from '../services/user';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Amend VIN Called');
  try {
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

    const userDetails = getUserDetails(event.headers.Authorization!);
    const [recordToArchive, newRecord] = processPatchVinRequest(currentRecord, event, userDetails);
    await archiveOldCreateCurrentRecord(
      recordToArchive,
      newRecord,
    );

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(newRecord)),
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error((`${error}`));
    return addHttpHeaders({
      statusCode: 500,
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      body: JSON.stringify({ error: `Failed to update record : ${error}` }),
    });
  }
};
