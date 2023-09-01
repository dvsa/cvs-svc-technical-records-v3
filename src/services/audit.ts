import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { StatusCode } from '../util/enum';

export const setLastUpdatedAuditDetails = (
  techRecord: TechRecordType<'get'>,
  createdByName: string,
  createdById: string,
  date: string,
  statusCode: StatusCode,
): TechRecordType<'get'> => {
  techRecord.techRecord_lastUpdatedAt = date;
  techRecord.techRecord_lastUpdatedByName = createdByName;
  techRecord.techRecord_lastUpdatedById = createdById;
  techRecord.techRecord_statusCode = statusCode;
  return techRecord;
};

export const setCreatedAuditDetails = (
  techRecord: TechRecordType<'get'>,
  createdByName: string,
  createdById: string,
  date: string,
  statusCode: StatusCode,
): TechRecordType<'get'> => {
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
