import { UserDetails } from '../services/user';
import {
  TechrecordCar, TechrecordGet, TechrecordHgv, TechrecordMotorcycle, TechrecordPsv,
} from '../models/post';

export const processPatchVrmRequest = (currentRecord: TechrecordGet, userDetails: UserDetails, newVrm: string): Array<TechrecordGet> => {
  const recordToArchive: TechrecordGet = { ...currentRecord };
  const newRecord: TechrecordGet = { ...currentRecord };
  const date: string = new Date().toISOString();

  (newRecord as TechrecordHgv | TechrecordMotorcycle | TechrecordCar | TechrecordPsv).primaryVrm = newVrm.toUpperCase();
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
