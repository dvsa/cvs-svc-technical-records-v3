import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import {
  updateVehicle,
  getBySystemNumberAndCreatedTimestamp, searchByAll,
} from '../services/database';
import { TechrecordGet } from '../models/post';
import { formatTechRecord } from '../util/formatTechRecord';
import { SearchResult } from '../models/search';
import { processPatchVrmRequest } from '../processors/processVrmRequest';
import { validateUpdateVrmRequest } from '../validators/update';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Amend VRM Called');
  const isRequestInvalid: APIGatewayProxyResult | boolean = validateUpdateVrmRequest(event);
  if (isRequestInvalid) {
    return isRequestInvalid;
  }
  logger.debug('Request is Valid');
  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newVrm: string = JSON.parse(event.body ?? '').newVrm as string;
  const currentRecord: TechrecordGet = await getBySystemNumberAndCreatedTimestamp(
    systemNumber,
    createdTimestamp,
  ) as TechrecordGet;
  const techRecords: SearchResult[] = await searchByAll(newVrm);
  logger.info(techRecords);
  const letFilteredVrm = techRecords.filter((x) => x.primaryVrm === newVrm);
  if (letFilteredVrm.length !== 0) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify(`Primary VRM ${newVrm} already exists`),
    });
  }
  logger.debug('identifier has been validated');
  try {
    const [recordToArchive, newRecord] = processPatchVrmRequest(currentRecord, event);

    await updateVehicle(
      [recordToArchive],
      newRecord,
    );
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(formatTechRecord(newRecord)),
    });
  } catch (error) {
    console.log(error);
    return addHttpHeaders({
      statusCode: 500,
      body: JSON.stringify(error),
    });
  }
};
