import { TechrecordGet, TechrecordPut } from '../models/post';
import { UserDetails } from '../services/user';
import { STATUS, UpdateType } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { validateAndComputeRecordCompleteness } from '../validators/recordCompleteness';

export const processUpdateRequest = async (recordFromDB: TechrecordGet, requestBody: TechrecordPut, userDetails: UserDetails): Promise<(TechrecordGet | TechrecordPut)[]> => {
  const formattedRecordFromDB = formatTechRecord(recordFromDB);

  const newRecord = { ...formattedRecordFromDB, ...requestBody } as TechrecordGet;

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
  let updateType = UpdateType.TECH_RECORD_UPDATE;
  Object.entries(newRecord).forEach(([key, value]) => {
    if (/techRecord_adrDetails_[a-zA-Z]+/.test(key)) {
      if (value !== oldRecord[key as keyof TechrecordGet]) {
        updateType = UpdateType.ADR;
        return updateType;
      }
    }
    return updateType;
  });
  return updateType;
};
