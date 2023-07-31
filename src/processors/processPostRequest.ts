import {
  TechRecordCar, TechRecordGet, TechRecordHgv, TechRecordMotorcycle, TechRecordPut, TechRecordTrl,
} from '../models/post';
import { NumberTypes, generateNewNumber } from '../services/testNumber';
import { UserDetails } from '../services/user';
import { ERRORS, HttpMethod } from '../util/enum';
import { flattenArrays } from '../util/formatTechRecord';
import logger from '../util/logger';
import { isObjectEmpty } from '../validators/emptyObject';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processPostRequest = async (input: TechRecordPut, userDetails: UserDetails): Promise<TechRecordGet> => {
  logger.info('processing request');
  if (isObjectEmpty(input)) {
    throw new Error(ERRORS.MISSING_PAYLOAD);
  }

  (input as TechRecordGet).techRecord_recordCompleteness = validateAndComputeRecordCompleteness(input, HttpMethod.PUT);

  const request: TechRecordPut = await flattenArrays(input) as TechRecordPut;
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  if (request.techRecord_vehicleType !== 'trl' && !request.primaryVrm) {
    (request as TechRecordHgv | TechRecordMotorcycle | TechRecordCar).primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId && ((request as TechRecordTrl).techRecord_euVehicleCategory === 'o1' || (request as TechRecordTrl).techRecord_euVehicleCategory === 'o2')) {
    (request as TechRecordTrl).trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId) {
    (request as TechRecordTrl).trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  (request as TechRecordGet).systemNumber = systemNumber;
  (request as TechRecordGet).createdTimestamp = new Date().toISOString();
  (request as TechRecordGet).partialVin = request.vin.length < 6 ? request.vin : request.vin.substring(request.vin.length - 6);
  (request as TechRecordGet).techRecord_createdByName = userDetails.username;
  (request as TechRecordGet).techRecord_createdById = userDetails.msOid;
  logger.info('Successfully Processed Record');
  return request as TechRecordGet;
};
