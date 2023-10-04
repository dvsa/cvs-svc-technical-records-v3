import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { addVehicleClassCode } from '../services/vehicleClass';
import { HttpMethod, StatusCode, UpdateType } from '../util/enum';
import { flattenArrays } from '../util/formatTechRecord';
import { createPartialVin } from '../util/partialVin';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processUpdateRequest = (
  recordFromDB: TechRecordType<'get'>,
  newRecord: TechRecordType<'put'>,
  userDetails: UserDetails,
): (TechRecordType<'get'> | TechRecordType<'put'>)[] => {
  // eslint-disable-next-line max-len
  (newRecord as TechRecordType<'get'>).techRecord_recordCompleteness = validateAndComputeRecordCompleteness(newRecord as TechRecordType<'get'>, HttpMethod.PUT);
  addVehicleIdentifiers(recordFromDB, newRecord);

  const flattenedNewRecord = flattenArrays(newRecord) as TechRecordType<'get'>;

  const updateType = getUpdateType(flattenedNewRecord, recordFromDB);
  recordFromDB.techRecord_updateType = updateType;

  const date = new Date().toISOString();
  const updatedRecordFromDB = setLastUpdatedAuditDetails(
    recordFromDB,
    userDetails.username,
    userDetails.msOid,
    date,
    StatusCode.ARCHIVED,
  );
  const updatedNewRecord = setCreatedAuditDetails(
    flattenedNewRecord,
    userDetails.username,
    userDetails.msOid,
    date,
    flattenedNewRecord.techRecord_statusCode as StatusCode,
  );
  addVehicleClassCode(updatedNewRecord);

  return [updatedRecordFromDB, updatedNewRecord];
};

export const getUpdateType = (oldRecord: TechRecordType<'get'>, newRecord: TechRecordType<'get'>): UpdateType => {
  const isAdrUpdate = Object.entries(newRecord).some(([key, value]) => /techRecord_adrDetails_[a-zA-Z]+/.test(key)
   && oldRecord[key as keyof TechRecordType<'get'>] !== value);
  return isAdrUpdate ? UpdateType.ADR : UpdateType.TECH_RECORD_UPDATE;
};

export const addVehicleIdentifiers = (recordFromDB: TechRecordType<'get'>, techRecord: TechRecordType<'put'>): void => {
  if (techRecord.techRecord_vehicleType !== 'trl' && recordFromDB.techRecord_vehicleType !== 'trl') {
    techRecord.primaryVrm = recordFromDB.primaryVrm;
  }

  if (techRecord.techRecord_vehicleType === 'trl' && recordFromDB.techRecord_vehicleType === 'trl') {
    techRecord.trailerId = recordFromDB.trailerId;
  }

  (techRecord as TechRecordType<'get'>).systemNumber = recordFromDB.systemNumber;

  const newVin = techRecord.vin ?? recordFromDB.vin;
  techRecord.vin = newVin.toUpperCase();
  (techRecord as TechRecordType<'get'>).partialVin = createPartialVin(newVin);
};
