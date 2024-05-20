import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';

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
