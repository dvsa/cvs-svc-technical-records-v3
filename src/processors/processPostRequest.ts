import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { NumberTypes, generateNewNumber } from '../services/testNumber';
import { UserDetails } from '../services/user';
import { ERRORS, HttpMethod } from '../util/enum';
import { flattenArrays } from '../util/formatTechRecord';
import logger from '../util/logger';
import { isTRL } from '../util/vehicle-type-narrowing';
import { isObjectEmpty } from '../validators/emptyObject';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processPostRequest = async (input: TechRecordType<'put'>, userDetails: UserDetails): Promise<TechRecordType<'get'>> => {
  logger.info('processing request');
  if (isObjectEmpty(input)) {
    throw new Error(ERRORS.MISSING_PAYLOAD);
  }

  input.techRecord_createdByName = userDetails.username;
  input.techRecord_createdById = userDetails.msOid;

  (input as TechRecordType<'get'>).techRecord_recordCompleteness = validateAndComputeRecordCompleteness(input, HttpMethod.PUT);

  const requestAsGet: TechRecordType<'get'> = flattenArrays(input) as TechRecordType<'get'>;
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  if (!isTRL(requestAsGet) && !requestAsGet.primaryVrm) {
    requestAsGet.primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (isTRL(requestAsGet) && !requestAsGet.trailerId && ((requestAsGet).techRecord_euVehicleCategory === 'o1' || (requestAsGet).techRecord_euVehicleCategory === 'o2')) {
    requestAsGet.trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (isTRL(requestAsGet) && !requestAsGet.trailerId) {
    requestAsGet.trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  requestAsGet.systemNumber = systemNumber;
  requestAsGet.createdTimestamp = new Date().toISOString();
  requestAsGet.partialVin = requestAsGet.vin.length < 6 ? requestAsGet.vin : requestAsGet.vin.substring(requestAsGet.vin.length - 6);
  logger.info('Successfully Processed Record');
  return requestAsGet;
};
