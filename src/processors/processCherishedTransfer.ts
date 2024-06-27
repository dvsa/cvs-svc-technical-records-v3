import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { SQSRecord } from 'aws-lambda';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { MotCherishedTransfer } from '../models/motCherishedTransfer';
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from '../services/database';
import { SearchCriteria } from '../models/search';
import logger from '../util/logger';

const SYSTEM_USER = 'CVS Automated Cherished Transfer';

export const processCherishedTransfer = (
  userDetails: UserDetails,
  newVrm: string,
  recipientRecord: TechRecordType<'get'>,
  thirdMark?: string,
  donorRecord?: TechRecordType<'get'>,
) => {
  const recordsToUpdate = [];
  const recordsToArchive = [];

  if (thirdMark && donorRecord) {
    const donorToArchive = { ...donorRecord };
    const donorOldVrms = formatSecondaryVrms(donorRecord);

    const updatedDonorRecordToArchive = setLastUpdatedAuditDetails(
      donorToArchive,
      userDetails.username,
      userDetails.msOid,
      new Date().toISOString(),
      StatusCode.ARCHIVED,
    );

    const updatedDonorRecord = setCreatedAuditDetails(
      donorRecord,
      userDetails.username,
      userDetails.msOid,
      new Date().toISOString(),
      StatusCode.CURRENT,
    );
    if (updatedDonorRecord.techRecord_vehicleType !== 'trl') {
      updatedDonorRecord.primaryVrm = thirdMark.toUpperCase();
      updatedDonorRecord.secondaryVrms = donorOldVrms;
    }
    updatedDonorRecord.techRecord_reasonForCreation = 'Update VRM - Cherished Transfer';
    recordsToUpdate.push(updatedDonorRecord);
    recordsToArchive.push(updatedDonorRecordToArchive);
  }
  const recordToArchive = { ...recipientRecord };
  const newRecord = { ...recipientRecord };
  const recipientOldVrms = formatSecondaryVrms(newRecord);

  const updatedRecipientRecordToArchive = setLastUpdatedAuditDetails(
    recordToArchive,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    StatusCode.ARCHIVED,
  );

  const newStatusCode = recipientRecord.techRecord_statusCode === StatusCode.CURRENT
    ? StatusCode.CURRENT
    : recipientRecord.techRecord_statusCode as StatusCode;

  const updatedRecipientNewRecord = setCreatedAuditDetails(
    newRecord,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    newStatusCode,
  );
  if (updatedRecipientNewRecord.techRecord_vehicleType !== 'trl') {
    updatedRecipientNewRecord.primaryVrm = newVrm.toUpperCase();
    updatedRecipientNewRecord.secondaryVrms = recipientOldVrms;
  }
  updatedRecipientNewRecord.techRecord_reasonForCreation = 'Update VRM - Cherished Transfer';
  recordsToUpdate.unshift(updatedRecipientNewRecord);
  recordsToArchive.unshift(updatedRecipientRecordToArchive);

  return { recordsToUpdate, recordsToArchive };
};

const formatSecondaryVrms = (record:TechRecordType<'get'>): Array<string> | undefined => {
  if (record.techRecord_vehicleType !== 'trl') {
    const secondaryVrms: string[] = record.secondaryVrms ? [...record.secondaryVrms] : [];
    secondaryVrms.push(record.primaryVrm ?? '');
    return secondaryVrms;
  }
  return undefined;
};

export const processRecord = async (cherishedTransfer: SQSRecord) => {
  const parsedRecord = JSON.parse(cherishedTransfer.body) as MotCherishedTransfer;
  const allRecords = await searchByCriteria(SearchCriteria.VIN, parsedRecord.vin);

  if (!allRecords.length) {
    logger.info(`No record found for VIN: ${parsedRecord.vin}`);
    return [];
  }
  const allCurrentRecords = allRecords.filter(({ techRecord_statusCode }) => techRecord_statusCode === StatusCode.CURRENT);

  if (!allCurrentRecords.length) {
    logger.info(`No current record found for VIN: ${parsedRecord.vin}`);
    return [];
  }

  if (allCurrentRecords.length > 1) {
    logger.info(`Duplicate current records found for VIN ${parsedRecord.vin}`);
    return [];
  }
  const currentRecord = allCurrentRecords[0];
  if (currentRecord.primaryVrm === parsedRecord.vrm) {
    logger.info(`No update needed for VRM ${parsedRecord.vrm} and VIN ${parsedRecord.vin}`);
    return [];
  }

  const completeTechRecord: TechRecordType<'get'> = await getBySystemNumberAndCreatedTimestamp(
    currentRecord.systemNumber,
    currentRecord.createdTimestamp,
  );

  const {
    recordsToArchive,
    recordsToUpdate,
  } = processCherishedTransfer(
    {
      msOid: SYSTEM_USER,
      username: SYSTEM_USER,
      email: '',
    },
    parsedRecord.vrm,
    completeTechRecord,
  );
  await updateVehicle(recordsToArchive, recordsToUpdate);
  logger.info(`Updated systemNumber ${currentRecord.systemNumber} with VRM ${parsedRecord.vrm}`);

  return recordsToUpdate;
};
