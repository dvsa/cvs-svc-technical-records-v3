import {
    TechRecordCar, TechRecordGet, TechRecordHgv, TechRecordMotorcycle, TechRecordPsv, TechRecordPut, TechRecordTrl,
} from '../models/post';
import { UserDetails } from '../services/user';
import { HttpMethod, STATUS, UpdateType } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processUpdateRequest = async (recordFromDB: TechRecordGet, requestBody: TechRecordPut, userDetails: UserDetails): Promise<(TechRecordGet | TechRecordPut)[]> => {
  const formattedRecordFromDB = formatTechRecord(recordFromDB);

  const updatedRequest = processVehicleIdentifiers(recordFromDB, requestBody);

  const newRecord = { ...formattedRecordFromDB, ...updatedRequest } as TechRecordGet;

  newRecord.techRecord_recordCompleteness = validateAndComputeRecordCompleteness(newRecord, HttpMethod.GET);

  const flattenedNewRecord = await flattenArrays(newRecord) as TechRecordGet;

  const updateType = getUpdateType(flattenedNewRecord, recordFromDB);
  recordFromDB.techRecord_updateType = updateType;

  const date = new Date().toISOString();
  const updatedRecordFromDB = setLastUpdatedAuditDetails(recordFromDB, userDetails.username, userDetails.msOid, date);
  const updatedNewRecord = setCreatedAuditDetails(flattenedNewRecord, userDetails.username, userDetails.msOid, date);

  return [updatedRecordFromDB, updatedNewRecord];
};

export const setLastUpdatedAuditDetails = (techRecord: TechRecordGet, createdByName: string, createdById: string, date: string) => {
  techRecord.techRecord_lastUpdatedAt = date;
  techRecord.techRecord_lastUpdatedByName = createdByName;
  techRecord.techRecord_lastUpdatedById = createdById;
  techRecord.techRecord_statusCode = STATUS.ARCHIVED;
  return techRecord;
};

export const setCreatedAuditDetails = (techRecord: TechRecordGet, createdByName: string, createdById: string, date: string) => {
  techRecord.techRecord_createdAt = date;
  techRecord.techRecord_createdByName = createdByName;
  techRecord.techRecord_createdById = createdById;
  techRecord.createdTimestamp = date;
  delete techRecord.techRecord_lastUpdatedAt;
  delete techRecord.techRecord_lastUpdatedById;
  delete techRecord.techRecord_lastUpdatedByName;
  return techRecord;
};

export const getUpdateType = (oldRecord: TechRecordGet, newRecord: TechRecordGet): UpdateType => {
  const isAdrUpdate = Object.entries(newRecord).some(([key, value]) => /techRecord_adrDetails_[a-zA-Z]+/.test(key) && oldRecord[key as keyof TechRecordGet] !== value);
  return isAdrUpdate ? UpdateType.ADR : UpdateType.TECH_RECORD_UPDATE;
};

export const processVehicleIdentifiers = (recordFromDB: TechRecordGet, requestBody: TechRecordPut) => {
  const techRecord = { ...requestBody } as TechRecordGet;

  const newVrm = (techRecord as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm;
  const existingVrm = (recordFromDB as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm;
  if (newVrm !== undefined && newVrm !== null && newVrm !== existingVrm) {
    (techRecord as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm = existingVrm;
  }

  const newTrailerId = (techRecord as TechRecordTrl).trailerId;
  if (newTrailerId !== undefined && newTrailerId !== null && newTrailerId !== (recordFromDB as TechRecordTrl).trailerId) {
    (techRecord as TechRecordTrl).trailerId = (recordFromDB as TechRecordTrl).trailerId;
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
