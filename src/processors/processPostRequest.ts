import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { setCreatedAuditDetails } from '../services/audit';
import { NumberTypes, generateNewNumber } from '../services/testNumber';
import { UserDetails } from '../services/user';
import { addVehicleClassCode } from '../services/vehicleClass';
import { ERRORS, HttpMethod, StatusCode } from '../util/enum';
import { flattenArrays } from '../util/formatTechRecord';
import logger from '../util/logger';
import { isObjectEmpty } from '../validators/emptyObject';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processPostRequest = async (input: TechRecordType<'put'>, userDetails: UserDetails): Promise<TechRecordType<'get'>> => {
  logger.info('processing request');
  if (isObjectEmpty(input)) {
    throw new Error(ERRORS.MISSING_PAYLOAD);
  }

  (input as TechRecordType<'get'>).techRecord_recordCompleteness = validateAndComputeRecordCompleteness(input, HttpMethod.PUT);

  const requestAsGet: TechRecordType<'get'> = flattenArrays(input) as TechRecordType<'get'>;
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  if (requestAsGet.techRecord_vehicleType !== 'trl' && !requestAsGet.primaryVrm) {
    requestAsGet.primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (requestAsGet.techRecord_vehicleType === 'trl' && !requestAsGet.trailerId
  && ((requestAsGet).techRecord_euVehicleCategory === 'o1' || (requestAsGet).techRecord_euVehicleCategory === 'o2')) {
    requestAsGet.trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (requestAsGet.techRecord_vehicleType === 'trl' && !requestAsGet.trailerId) {
    requestAsGet.trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  const now = new Date().toISOString();

  const updatedNewRecord = setCreatedAuditDetails(
    requestAsGet,
    userDetails.username,
    userDetails.msOid,
    now,
    requestAsGet.techRecord_statusCode as StatusCode,
  );
  updatedNewRecord.systemNumber = systemNumber;
  updatedNewRecord.partialVin = updatedNewRecord.vin.length < 6
    ? updatedNewRecord.vin : updatedNewRecord.vin.substring(updatedNewRecord.vin.length - 6);
  addVehicleClassCode(updatedNewRecord);
  logger.info('Successfully Processed Record');
  return updatedNewRecord;
};
