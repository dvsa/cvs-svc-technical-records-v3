import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { UserDetails } from '../services/user';

export const processCorrectVrm = (
  currentRecord: TechRecordType<'get'>,
  userDetails: UserDetails,
  newVrm: string,
): TechRecordType<'get'> => {
  const newRecord: TechRecordType<'get'> = { ...currentRecord };
  if (newRecord.techRecord_vehicleType !== 'trl') {
    newRecord.primaryVrm = newVrm.toUpperCase();
  }
  newRecord.techRecord_lastUpdatedAt = new Date().toISOString();
  newRecord.techRecord_lastUpdatedById = userDetails.msOid;
  newRecord.techRecord_lastUpdatedByName = userDetails.username;

  return newRecord;
};
