import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import {
  TechRecordCar, TechRecordHgv, TechRecordMotorcycle, TechRecordPsv,
} from '../models/post';
import { SearchCriteria, SearchResult } from '../models/search';
import { UpdateVrmRequestBody } from '../models/updateVrm';
import { processPatchVrmRequest } from '../processors/processVrmRequest';
import {
  correctVrm, getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle,
} from '../services/database';
import { getUserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateUpdateVrmRequest, validateVrm } from '../validators/update';

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

    const techRecords = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm);
    logger.debug('Tech record search returned: ', techRecords);
    const filteredVrm = techRecords.filter((x) => (x as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm === newVrm && x.techRecord_statusCode !== StatusCode.ARCHIVED);
    if (filteredVrm.length) {
      return addHttpHeaders({
        statusCode: 400,
        body: JSON.stringify(`Primary VRM ${newVrm} already exists`),
      });
    }
    logger.debug('identifier has been validated');
    const userDetails = getUserDetails(event.headers.Authorization ?? '');
    const [recordToArchive, newRecord] = processPatchVrmRequest(currentRecord, userDetails, newVrm, isCherishedTransfer);

    if (isCherishedTransfer) {
      await updateVehicle(
        [recordToArchive],
        [newRecord],
      );
    } else {
      await correctVrm(newRecord);
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
