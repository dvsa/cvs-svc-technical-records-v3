import {
  TechRecordCar, TechRecordGet, TechRecordHgv, TechRecordMotorcycle, TechRecordPsv,
} from '../models/post';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';

export const processPatchVrmRequest = (currentRecord: TechRecordGet, userDetails: UserDetails, newVrm: string, isCherishedTransfer: boolean): Array<TechRecordGet> => {
  if (isCherishedTransfer) {
    const recordToArchive: TechRecordGet = { ...currentRecord };
    const newRecord: TechRecordGet = { ...currentRecord };

    const updatedNewRecord = setCreatedAuditDetails(newRecord, userDetails.username, userDetails.msOid, new Date().toISOString(), currentRecord.techRecord_statusCode as StatusCode);
    (updatedNewRecord as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm = newVrm.toUpperCase();
    const updatedRecordToArchive = setLastUpdatedAuditDetails(recordToArchive, userDetails.username, userDetails.msOid, new Date().toISOString(), StatusCode.ARCHIVED);
    updatedNewRecord.techRecord_reasonForCreation = 'Update VRM - Cherished Transfer';
    return [updatedRecordToArchive, newRecord];
  }
  const newRecord: TechRecordGet = { ...currentRecord };
  const updatedRecordToArchive = {} as TechRecordGet;
  (newRecord as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm = newVrm.toUpperCase();
  newRecord.techRecord_lastUpdatedAt = new Date().toISOString();
  newRecord.techRecord_lastUpdatedById = userDetails.msOid;
  newRecord.techRecord_lastUpdatedByName = userDetails.username;

  return [updatedRecordToArchive, newRecord];
};
