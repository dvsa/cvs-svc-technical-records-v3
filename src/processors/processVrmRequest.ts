import {
  TechRecordCar, TechRecordGet, TechRecordHgv, TechRecordMotorcycle, TechRecordPsv,
} from '../models/post';
import { UserDetails } from '../services/user';

export const processPatchVrmRequest = (currentRecord: TechRecordGet, userDetails: UserDetails, newVrm: string): Array<TechRecordGet> => {
  const recordToArchive: TechRecordGet = { ...currentRecord };
  const newRecord: TechRecordGet = { ...currentRecord };
  const date: string = new Date().toISOString();

  (newRecord as TechRecordHgv | TechRecordMotorcycle | TechRecordCar | TechRecordPsv).primaryVrm = newVrm.toUpperCase();
  newRecord.createdTimestamp = date;
  delete newRecord.techRecord_lastUpdatedAt;
  newRecord.techRecord_createdByName = userDetails.username;
  newRecord.techRecord_createdById = userDetails.msOid;
  recordToArchive.techRecord_statusCode = 'archived';
  recordToArchive.techRecord_lastUpdatedAt = date;
  recordToArchive.techRecord_lastUpdatedByName = userDetails.username;
  recordToArchive.techRecord_lastUpdatedById = userDetails.msOid;

  return [recordToArchive, newRecord];
};
