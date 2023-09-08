import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyResult } from 'aws-lambda';
import { SearchCriteria } from '../models/search';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from '../services/database';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import { validateVrm } from '../validators/update';
import logger from '../util/logger';

export const processCherishedTransfer = async (
  userDetails: UserDetails,
  newVrm: string,
  recipientRecord: TechRecordType<'get'>,
  newDonorVrm?: string,
)
: Promise<TechRecordType<'get'>[]> => {
  if (newDonorVrm) {
    return cherishedTransferWithDonor(
      userDetails,
      newVrm,
      newDonorVrm,
      recipientRecord,
    );
  }
  return cherishedTransferNoDonorVehicle(newVrm, recipientRecord, userDetails);
};

const formatSecondaryVrms = (record:TechRecordType<'get'>): Array<string> | undefined => {
  if (record.techRecord_vehicleType !== 'trl') {
    const secondaryVrms: string[] = record.secondaryVrms ? [...record.secondaryVrms] : [];
    secondaryVrms.push(record.primaryVrm!);
    return secondaryVrms;
  }
  return undefined;
};

const cherishedTransferNoDonorVehicle = async (
  newVrm: string,
  recipientRecord: TechRecordType<'get'>,
  userDetails: UserDetails,
): Promise<TechRecordType<'get'>[] | APIGatewayProxyResult> => {
  const recordSearch = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm);
  const recordExists = recordSearch.filter((x) => x.techRecord_statusCode !== StatusCode.ARCHIVED);
  if (recordExists.length !== 0) {
    return addHttpHeaders({
      statusCode: 400,
      body: `no vehicles with VRM ${newVrm} have a current record`,
    });
  }

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

const cherishedTransferWithDonor = async (
  userDetails: UserDetails,
  newVrm: string,
  newDonorVrm: string,
  recipientRecord: TechRecordType<'get'>,
): Promise<TechRecordType<'get'>[] | APIGatewayProxyResult> => {
  const donorRecords = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm);
  const currentDonorRecordDetails = donorRecords.filter((x) => x.techRecord_statusCode === StatusCode.CURRENT);
  if (currentDonorRecordDetails.length <= 0) {
    return addHttpHeaders({
      statusCode: 400,
      body: `no vehicles with VRM ${newVrm} have a current record`,
    });
  }
  const donorRecord = await getBySystemNumberAndCreatedTimestamp(
    currentDonorRecordDetails[0].systemNumber,
    currentDonorRecordDetails[0].createdTimestamp,
  );
  const donorToArchive = { ...donorRecord };

  const donorVrmsNotIncorrectFormat = validateVrm(donorRecord, newDonorVrm);
  if (donorVrmsNotIncorrectFormat) {
    return addHttpHeaders(donorVrmsNotIncorrectFormat);
  }

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
