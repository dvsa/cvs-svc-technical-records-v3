import {
  TechRecordCar, TechRecordGet, TechRecordHgv, TechRecordMotorcycle, TechRecordPsv, TechRecordPut, TechRecordTrl,
} from '../models/post';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { HttpMethod, StatusCode, UpdateType } from '../util/enum';
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
