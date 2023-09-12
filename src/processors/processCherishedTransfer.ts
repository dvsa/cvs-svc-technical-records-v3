import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';

export const processCherishedTransfer = (
  userDetails: UserDetails,
  newVrm: string,
  recipientRecord: TechRecordType<'get'>,
  newDonorVrm?: string,
  donorRecord?: TechRecordType<'get'>,
)
: TechRecordType<'get'>[] => {
  if (newDonorVrm && donorRecord) {
    return cherishedTransferWithDonor(
      userDetails,
      newVrm,
      newDonorVrm,
      recipientRecord,
      donorRecord,
    );
  }
  return cherishedTransferNoDonorVehicle(newVrm, recipientRecord, userDetails);
};

const formatSecondaryVrms = (record:TechRecordType<'get'>): Array<string> | undefined => {
  if (record.techRecord_vehicleType !== 'trl') {
    const secondaryVrms: string[] = record.secondaryVrms ? [...record.secondaryVrms] : [];
    secondaryVrms.push(record.primaryVrm ?? '');
    return secondaryVrms;
  }
  return undefined;
};

const cherishedTransferNoDonorVehicle = (
  newVrm: string,
  recipientRecord: TechRecordType<'get'>,
  userDetails: UserDetails,
): TechRecordType<'get'>[] => {
  const recordToArchive = { ...recipientRecord };
  const newRecord = { ...recipientRecord };
  const recipientOldVrms = formatSecondaryVrms(newRecord);

  const updatedRecordToArchive = setLastUpdatedAuditDetails(
    recordToArchive,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    StatusCode.ARCHIVED,
  );

  const updatedNewRecord = setCreatedAuditDetails(
    newRecord,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    recipientRecord.techRecord_statusCode as StatusCode,
  );
  if (updatedNewRecord.techRecord_vehicleType !== 'trl') {
    updatedNewRecord.primaryVrm = newVrm.toUpperCase();
    updatedNewRecord.secondaryVrms = recipientOldVrms;
  }
  updatedNewRecord.techRecord_reasonForCreation = 'Update VRM - Cherished Transfer';

  return [updatedNewRecord, updatedRecordToArchive, {} as TechRecordType<'get'>, {} as TechRecordType<'get'>];
};

const cherishedTransferWithDonor = (
  userDetails: UserDetails,
  newVrm: string,
  newDonorVrm: string,
  recipientRecord: TechRecordType<'get'>,
  donorRecord: TechRecordType<'get'>,
): TechRecordType<'get'>[] => {
  const donorToArchive = { ...donorRecord };

  const recipientRecordToArchive: TechRecordType<'get'> = { ...recipientRecord };
  const recipientNewRecord: TechRecordType<'get'> = { ...recipientRecord };

  const recipientOldVrms = formatSecondaryVrms(recipientRecordToArchive);
  const donorOldVrms = formatSecondaryVrms(donorRecord);

  const updatedNewRecord = setCreatedAuditDetails(
    recipientNewRecord,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    recipientRecord.techRecord_statusCode as StatusCode,
  );
  if (updatedNewRecord.techRecord_vehicleType !== 'trl') {
    updatedNewRecord.primaryVrm = newVrm.toUpperCase();
    updatedNewRecord.secondaryVrms = recipientOldVrms;
  }
  updatedNewRecord.techRecord_reasonForCreation = 'Update VRM - Cherished Transfer';

  const updatedRecordToArchive = setLastUpdatedAuditDetails(
    recipientRecordToArchive,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    StatusCode.ARCHIVED,
  );

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
    updatedDonorRecord.primaryVrm = newDonorVrm.toUpperCase();
    updatedDonorRecord.secondaryVrms = donorOldVrms;
  }
  updatedDonorRecord.techRecord_reasonForCreation = 'Update VRM - Cherished Transfer';

  return [updatedNewRecord, updatedRecordToArchive, updatedDonorRecord, updatedDonorRecordToArchive];
};
