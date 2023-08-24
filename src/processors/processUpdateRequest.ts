import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { HttpMethod, StatusCode, UpdateType } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { isTRL } from '../util/vehicle-type-narrowing';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processUpdateRequest = (recordFromDB: TechRecordType<'get'>, requestBody: TechRecordType<'put'>, userDetails: UserDetails): (TechRecordType<'get'> | TechRecordType<'put'>)[] => {
  const formattedRecordFromDB = formatTechRecord<typeof recordFromDB>(recordFromDB);

  const newRecord = { ...formattedRecordFromDB, ...requestBody };

  (newRecord as TechRecordType<'get'>).techRecord_recordCompleteness = validateAndComputeRecordCompleteness(newRecord as TechRecordType<'get'>, HttpMethod.PUT);
  addVehicleIdentifiers(recordFromDB, requestBody);

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

  return [updatedRecordFromDB, updatedNewRecord];
};

export const getUpdateType = (oldRecord: TechRecordType<'get'>, newRecord: TechRecordType<'get'>): UpdateType => {
  const isAdrUpdate = Object.entries(newRecord).some(([key, value]) => /techRecord_adrDetails_[a-zA-Z]+/.test(key) && oldRecord[key as keyof TechRecordType<'get'>] !== value);
  return isAdrUpdate ? UpdateType.ADR : UpdateType.TECH_RECORD_UPDATE;
};

export const addVehicleIdentifiers = (recordFromDB: TechRecordType<'get'>, techRecord: TechRecordType<'put'>): void => {
  const vehicleType = techRecord.techRecord_vehicleType ?? recordFromDB.techRecord_vehicleType;

  if (vehicleType && vehicleType !== 'trl') {
    const newVrm = (techRecord as TechRecordTypeByVehicle<'hgv'> | TechRecordTypeByVehicle<'psv'> | TechRecordTypeByVehicle<'motorcycle'> | TechRecordTypeByVehicle<'car'> | TechRecordTypeByVehicle<'lgv'>).primaryVrm;
    const existingVrm = !isTRL(recordFromDB) ? recordFromDB.primaryVrm : '';
    if (newVrm !== undefined && newVrm !== null && newVrm !== existingVrm) {
      (techRecord as TechRecordTypeByVehicle<'hgv'> | TechRecordTypeByVehicle<'psv'> | TechRecordTypeByVehicle<'motorcycle'> | TechRecordTypeByVehicle<'car'> | TechRecordTypeByVehicle<'lgv'>).primaryVrm = existingVrm;
    }
  }

  if (vehicleType === 'trl') {
    const newTrailerId = (techRecord as TechRecordTypeByVehicle<'trl'>).trailerId;
    if (newTrailerId !== undefined && newTrailerId !== null && newTrailerId !== (recordFromDB as TechRecordTypeByVehicle<'trl'>).trailerId) {
      (techRecord as TechRecordTypeByVehicle<'trl'>).trailerId = (recordFromDB as TechRecordTypeByVehicle<'trl'>).trailerId;
    }
  }

  if ((techRecord as TechRecordType<'get'>).systemNumber) {
    (techRecord as TechRecordType<'get'>).systemNumber = recordFromDB.systemNumber;
  }

  if ((techRecord as TechRecordType<'get'>).partialVin) {
    (techRecord as TechRecordType<'get'>).partialVin = recordFromDB.partialVin;
  }

  const newVin = techRecord.vin;
  if (newVin !== undefined && newVin !== null && newVin !== recordFromDB.vin) {
    techRecord.vin = newVin.toUpperCase();
    if (newVin.length < 6) {
      (techRecord as TechRecordType<'get'>).partialVin = newVin.toUpperCase();
    } else {
      (techRecord as TechRecordType<'get'>).partialVin = newVin.substring(Math.max(newVin.length - 6)).toUpperCase();
    }
  }
};
