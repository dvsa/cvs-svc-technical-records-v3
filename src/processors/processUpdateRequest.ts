import { TechrecordGet, TechrecordPut } from '../models/post';
import { STATUS, UpdateType } from '../util/enum';

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
