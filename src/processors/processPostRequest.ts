import {
  TechrecordCar, TechrecordGet, TechrecordHgv, TechrecordMotorcycle, TechrecordPut, TechrecordTrl,
} from '../models/post';
import { generateNewNumber, NumberTypes } from '../services/testNumber';
import { UserDetails } from '../services/user';
import { ERRORS } from '../util/enum';
import { flattenArrays } from '../util/formatTechRecord';
import logger from '../util/logger';
import { isObjectEmpty } from '../validators/emptyObject';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processPostRequest = async (input: TechrecordPut, userDetails: UserDetails): Promise<TechrecordGet> => {
  logger.info('processing request');
  if (isObjectEmpty(input)) {
    throw new Error(ERRORS.MISSING_PAYLOAD);
  }

  (input as TechrecordGet).techRecord_recordCompleteness = validateAndComputeRecordCompleteness(input);

  const request: TechrecordPut = await flattenArrays(input) as TechrecordPut;
  // helper method for handler
  const systemNumber = await generateNewNumber(NumberTypes.SystemNumber);
  if (request.techRecord_vehicleType !== 'trl' && !request.primaryVrm) {
    (request as TechrecordHgv | TechrecordMotorcycle | TechrecordCar).primaryVrm = await generateNewNumber(NumberTypes.ZNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId && ((request as TechrecordTrl).techRecord_euVehicleCategory === 'o1' || (request as TechrecordTrl).techRecord_euVehicleCategory === 'o2')) {
    (request as TechrecordTrl).trailerId = await generateNewNumber(NumberTypes.TNumber);
  }
  if (request.techRecord_vehicleType === 'trl' && !request.trailerId) {
    (request as TechrecordTrl).trailerId = await generateNewNumber(NumberTypes.TrailerId);
  }
  (request as TechrecordGet).systemNumber = systemNumber;
  (request as TechrecordGet).createdTimestamp = new Date().toISOString();
  (request as TechrecordGet).partialVin = request.vin.length < 6 ? request.vin : request.vin.substring(request.vin.length - 6);
  (request as TechrecordGet).techRecord_createdByName = userDetails.username;
  (request as TechrecordGet).techRecord_createdById = userDetails.msOid;
  logger.info('Successfully Processed Record');
  return request as TechrecordGet;
};
