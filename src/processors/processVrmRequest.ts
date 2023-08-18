import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { isTRL } from '../util/vehicle-type-narrowing';

export const processPatchVrmRequest = (currentRecord: TechRecordType<'get'>, userDetails: UserDetails, newVrm: string, isCherishedTransfer: boolean): Array<TechRecordType<'get'>> => {
  if (isCherishedTransfer) {
    const recordToArchive: TechRecordType<'get'> = { ...currentRecord };
    const newRecord: TechRecordType<'get'> = { ...currentRecord };

    const updatedNewRecord = setCreatedAuditDetails(newRecord, userDetails.username, userDetails.msOid, new Date().toISOString(), currentRecord.techRecord_statusCode as StatusCode);
    if (!isTRL(updatedNewRecord)) {
      updatedNewRecord.primaryVrm = newVrm.toUpperCase();
    }
    const updatedRecordToArchive = setLastUpdatedAuditDetails(recordToArchive, userDetails.username, userDetails.msOid, new Date().toISOString(), StatusCode.ARCHIVED);
    updatedNewRecord.techRecord_reasonForCreation = 'Update VRM - Cherished Transfer';
    return [updatedRecordToArchive, updatedNewRecord];
  }

  const newRecord: TechRecordType<'get'> = { ...currentRecord };
  const updatedRecordToArchive = {} as TechRecordType<'get'>;
  if (!isTRL(newRecord)) {
    newRecord.primaryVrm = newVrm.toUpperCase();
  }
  newRecord.techRecord_lastUpdatedAt = new Date().toISOString();
  newRecord.techRecord_lastUpdatedById = userDetails.msOid;
  newRecord.techRecord_lastUpdatedByName = userDetails.username;

  return [updatedRecordToArchive, newRecord];
};
