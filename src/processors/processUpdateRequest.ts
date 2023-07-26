import {
  TechrecordCar, TechrecordGet, TechrecordHgv, TechrecordMotorcycle, TechrecordPsv, TechrecordPut, TechrecordTrl,
} from '../models/post';
import { UserDetails } from '../services/user';
import { STATUS, UpdateType } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processUpdateRequest = async (recordFromDB: TechrecordGet, requestBody: TechrecordPut, userDetails: UserDetails): Promise<(TechrecordGet | TechrecordPut)[]> => {
  const formattedRecordFromDB = formatTechRecord(recordFromDB);

  const updatedRequest = processVehicleIdentifiers(recordFromDB, requestBody);

  const newRecord = { ...formattedRecordFromDB, ...updatedRequest } as TechrecordGet;

  newRecord.techRecord_recordCompleteness = validateAndComputeRecordCompleteness(newRecord as TechrecordPut);

  const flattenedNewRecord = await flattenArrays(newRecord) as TechrecordGet;

  const updateType = getUpdateType(flattenedNewRecord, recordFromDB);
  recordFromDB.techRecord_updateType = updateType;

  const date = new Date().toISOString();
  const updatedRecordFromDB = setLastUpdatedAuditDetails(recordFromDB, userDetails.username, userDetails.msOid, date);
  const updatedNewRecord = setCreatedAuditDetails(flattenedNewRecord, userDetails.username, userDetails.msOid, date);

  return [updatedRecordFromDB, updatedNewRecord];
};

export const setLastUpdatedAuditDetails = (techRecord: TechrecordGet, createdByName: string, createdById: string, date: string) => {
  techRecord.techRecord_lastUpdatedAt = date;
  techRecord.techRecord_lastUpdatedByName = createdByName;
  techRecord.techRecord_lastUpdatedById = createdById;
  techRecord.techRecord_statusCode = STATUS.ARCHIVED;
  return techRecord;
};

export const setCreatedAuditDetails = (techRecord: TechrecordGet, createdByName: string, createdById: string, date: string) => {
  techRecord.techRecord_createdAt = date;
  techRecord.techRecord_createdByName = createdByName;
  techRecord.techRecord_createdById = createdById;
  techRecord.createdTimestamp = date;
  delete techRecord.techRecord_lastUpdatedAt;
  delete techRecord.techRecord_lastUpdatedById;
  delete techRecord.techRecord_lastUpdatedByName;
  return techRecord as TechrecordPut;
};

export const getUpdateType = (oldRecord: TechrecordGet, newRecord: TechrecordGet): UpdateType => {
  const isAdrUpdate = Object.entries(newRecord).some(([key, value]) => /techRecord_adrDetails_[a-zA-Z]+/.test(key) && oldRecord[key as keyof TechrecordGet] !== value);
  return isAdrUpdate ? UpdateType.ADR : UpdateType.TECH_RECORD_UPDATE;
};

export const processVehicleIdentifiers = (recordFromDB: TechrecordGet, requestBody: TechrecordPut) => {
  const techRecord = { ...requestBody } as TechrecordGet;

  const newVrm = (techRecord as TechrecordHgv | TechrecordMotorcycle | TechrecordCar | TechrecordPsv).primaryVrm;
  const existingVrm = (recordFromDB as TechrecordHgv | TechrecordMotorcycle | TechrecordCar | TechrecordPsv).primaryVrm;
  if (newVrm !== undefined && newVrm !== null && newVrm !== existingVrm) {
    (techRecord as TechrecordHgv | TechrecordMotorcycle | TechrecordCar | TechrecordPsv).primaryVrm = existingVrm;
  }

  const newTrailerId = (techRecord as TechrecordTrl).trailerId;
  if (newTrailerId !== undefined && newTrailerId !== null && newTrailerId !== (recordFromDB as TechrecordTrl).trailerId) {
    (techRecord as TechrecordTrl).trailerId = (recordFromDB as TechrecordTrl).trailerId;
  }
  const newVin = techRecord.vin;
  if (newVin !== undefined && newVin !== null && newVin !== recordFromDB.vin) {
    techRecord.vin = newVin.toUpperCase();
    if (newVin.length < 6) {
      techRecord.partialVin = newVin.toUpperCase();
    } else {
      techRecord.partialVin = newVin.substring(Math.max(newVin.length - 6)).toUpperCase();
    }
  }
  return techRecord;
};
