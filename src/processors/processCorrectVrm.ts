import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { UserDetails } from '../services/user';
import { setLastUpdatedAuditDetails } from '../services/audit';
import { StatusCode } from '../util/enum';

export const processCorrectVrm = (
  currentRecord: TechRecordType<'get'>,
  userDetails: UserDetails,
  newVrm: string,
): TechRecordType<'get'> => {
  const newRecord: TechRecordType<'get'> = { ...currentRecord };
  const updatedRecord = setLastUpdatedAuditDetails(
    newRecord,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    newRecord.techRecord_statusCode as StatusCode,
  );
  if (updatedRecord.techRecord_vehicleType !== 'trl') {
    updatedRecord.primaryVrm = newVrm.toUpperCase();
  }

  return updatedRecord;
};
