import {
  TechRecordCar, TechRecordGet, TechRecordHgv, TechRecordMotorcycle, TechRecordPsv,
} from '../models/post';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';

export const processPatchVrmRequest = (currentRecord: TechRecordGet, userDetails: UserDetails, newVrm: string): Array<TechRecordGet> => {
  const recordToArchive: TechRecordGet = { ...currentRecord };
  const newRecord: TechRecordGet = { ...currentRecord };

  const updatedNewRecord = setCreatedAuditDetails(newRecord, userDetails.username, userDetails.msOid, new Date().toISOString(), currentRecord.techRecord_statusCode as StatusCode);
  (updatedNewRecord as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm = newVrm.toUpperCase();
  const updatedRecordToArchive = setLastUpdatedAuditDetails(recordToArchive, userDetails.username, userDetails.msOid, new Date().toISOString(), StatusCode.ARCHIVED);

  return [updatedRecordToArchive, newRecord];
};
