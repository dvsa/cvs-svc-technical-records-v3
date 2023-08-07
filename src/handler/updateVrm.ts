import 'dotenv/config';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { addHttpHeaders } from '../util/httpHeaders';
import { correctVrm, getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from '../services/database';
import { formatTechRecord } from '../util/formatTechRecord';
import { SearchCriteria, SearchResult } from '../models/search';
import { processPatchVrmRequest } from '../processors/processVrmRequest';
import { validateUpdateVrmRequest, validateVrm } from '../validators/update';
import { UpdateVrmRequestBody } from '../models/updateVrm';
import { getUserDetails } from '../services/user';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Amend VRM Called');
  try {
    const isRequestInvalid: APIGatewayProxyResult | boolean = validateUpdateVrmRequest(event);
    if (isRequestInvalid) {
      return isRequestInvalid;
    }
    logger.debug('Request is Valid');
    const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
    const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
    const { newVrm, isCherishedTransfer } = JSON.parse(event.body as string) as UpdateVrmRequestBody;
    const currentRecord = await getBySystemNumberAndCreatedTimestamp(
      systemNumber,
      createdTimestamp,
    );
    const validateVrmRes = validateVrm(currentRecord, newVrm);
    if (validateVrmRes) {
      return validateVrmRes;
    }

    const techRecords: SearchResult[] = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm);
    logger.debug('Get Tech record returned: ', techRecords);
    const letFilteredVrm = techRecords.filter((x) => x.primaryVrm === newVrm);
    if (letFilteredVrm.length) {
      return addHttpHeaders({
        statusCode: 400,
        body: JSON.stringify(`Primary VRM ${newVrm} already exists`),
      });
    }
    logger.debug('identifier has been validated');
    const userDetails = getUserDetails(event.headers.Authorization ?? '');
    const [recordToArchive, newRecord] = processPatchVrmRequest(currentRecord, userDetails, newVrm, isCherishedTransfer);
    logger.info("look here")
    logger.info(newRecord)

    if(isCherishedTransfer) {
      await updateVehicle(
      [recordToArchive],
      newRecord,
    );
  } else {
    await correctVrm(newRecord)
  }
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
