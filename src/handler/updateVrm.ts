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
import { validateTrailerId, validateUpdateVrmRequest, validateVrm } from '../validators/update';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Amend VRM Called');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
  const isRequestInvalid: APIGatewayProxyResult | undefined = validateUpdateVrmRequest(event);
  if (isRequestInvalid) {
    return isRequestInvalid;
  }
  logger.debug('Request is Valid');

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const newIdentifier: string = JSON.parse(event.body ?? '').newIdentifier as string;

  logger.info('newIdentifier');
  logger.info(newIdentifier);
  const currentRecord: TechrecordGet = await getBySystemNumberAndCreatedTimestamp(
    systemNumber,
    createdTimestamp,
  ) as TechrecordGet;
  let filtered: SearchResult[];
  const techRecords: SearchResult[] = await searchByAll(newIdentifier);
  if (currentRecord.techRecord_vehicleType === 'trl') {
    filtered = techRecords.filter((x) => x.trailerId === newIdentifier);
    if (filtered.length !== 0) {
      return addHttpHeaders({
        statusCode: 400,
        body: JSON.stringify(`Trailer id ${newIdentifier} already exists`),
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const isVrmInvalid: APIGatewayProxyResult | undefined = validateVrm(currentRecord, newIdentifier.toUpperCase());
    if (isVrmInvalid) {
      return isVrmInvalid;
    }
  } else {
    const letFilteredVrm = techRecords.filter((x) => x.primaryVrm === newIdentifier);
    logger.info('filtered');
    logger.info(letFilteredVrm);
    if (letFilteredVrm.length !== 0) {
      return addHttpHeaders({
        statusCode: 400,
        body: JSON.stringify(`Primary VRM ${newIdentifier} already exists`),
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const isTrailerIdInvalid: APIGatewayProxyResult | undefined = validateTrailerId(currentRecord, newIdentifier.toUpperCase());
    if (isTrailerIdInvalid) {
      return isTrailerIdInvalid;
    }
  }
  logger.debug('identifier has been validated');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
  const [recordToArchive, newRecord] = processPatchVrmRequest(
    currentRecord,
    event,
  );
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await updateVehicle(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      [recordToArchive],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      newRecord,
    );

    return addHttpHeaders({
      statusCode: 200,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      body: JSON.stringify(formatTechRecord(newRecord)),
    });
  } catch (error) {
    return addHttpHeaders({
      statusCode: 500,
      body: JSON.stringify(error),
    });
  }
};
