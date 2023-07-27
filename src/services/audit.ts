import { TechRecordGet } from '../models/post';
import { StatusCode } from '../util/enum';

export const setLastUpdatedAuditDetails = (techRecord: TechRecordGet, createdByName: string, createdById: string, date: string, statusCode: StatusCode) => {
  techRecord.techRecord_lastUpdatedAt = date;
  techRecord.techRecord_lastUpdatedByName = createdByName;
  techRecord.techRecord_lastUpdatedById = createdById;
  techRecord.techRecord_statusCode = statusCode;
  return techRecord;
};

export const setCreatedAuditDetails = (techRecord: TechRecordGet, createdByName: string, createdById: string, date: string, statusCode: StatusCode) => {
  techRecord.techRecord_createdAt = date;
  techRecord.techRecord_createdByName = createdByName;
  techRecord.techRecord_createdById = createdById;
  techRecord.createdTimestamp = date;
  techRecord.techRecord_statusCode = statusCode;
  delete techRecord.techRecord_lastUpdatedAt;
  delete techRecord.techRecord_lastUpdatedById;
  delete techRecord.techRecord_lastUpdatedByName;
  return techRecord;
};
