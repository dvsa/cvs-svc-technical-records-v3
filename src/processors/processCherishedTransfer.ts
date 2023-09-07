import { TechRecordType } from "@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb";
import { APIGatewayProxyResult } from "aws-lambda";
import { SearchCriteria } from "../models/search";
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from "../services/audit";
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from "../services/database";
import { UserDetails } from "../services/user";
import { StatusCode } from "../util/enum";
import { formatTechRecord } from "../util/formatTechRecord";
import { addHttpHeaders } from "../util/httpHeaders";
import { validateVrm } from "../validators/update";

export const processCherishedTransfer = async (userDetails: UserDetails, newVrm: string, newDonorVrm: string, recipientRecord: TechRecordType<'get'> ): Promise<APIGatewayProxyResult> => {
try {  const donorRecords = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm)
  const currentDonorRecordDetails = donorRecords.filter(x => x.techRecord_statusCode == StatusCode.CURRENT)
    if(currentDonorRecordDetails.length <= 0){
      return addHttpHeaders({
        statusCode: 400,
        body: `no vehicles with VRM ${newVrm} have a current record`,
      });
    }
  const donorRecord = await getBySystemNumberAndCreatedTimestamp(currentDonorRecordDetails[0].systemNumber, currentDonorRecordDetails[0].createdTimestamp)

  const donorVrmsNotIncorrectFormat = validateVrm(donorRecord, newDonorVrm);
  if (donorVrmsNotIncorrectFormat) {
    return addHttpHeaders(donorVrmsNotIncorrectFormat);
  }

  const recipientRecordToArchive: TechRecordType<'get'> = { ...recipientRecord };
  const recipientNewRecord: TechRecordType<'get'> = { ...recipientRecord };

  const recipientOldVrms = secondaryVrms(recipientRecordToArchive);
  const donorOldVrms = secondaryVrms(donorRecord);

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

  const updatedDonorRecord = setLastUpdatedAuditDetails(
    donorRecord!,
    userDetails.username,
    userDetails.msOid,
    new Date().toISOString(),
    StatusCode.CURRENT,
  )
  if (updatedDonorRecord.techRecord_vehicleType !== 'trl') {
    updatedDonorRecord.primaryVrm = newDonorVrm!.toUpperCase();
    updatedDonorRecord.secondaryVrms = donorOldVrms;
  }

  await updateVehicle(
    [updatedRecordToArchive, updatedDonorRecord],
    [updatedNewRecord],
  );

  return addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify(formatTechRecord(updatedNewRecord)),
  });
} catch (err) {
  return addHttpHeaders({
    statusCode: 500,
    body: JSON.stringify(err),
  });
}
}

const secondaryVrms = (record:TechRecordType<'get'>): Array<string> | undefined => {
  if(record.techRecord_vehicleType !== 'trl'){
  const secondaryVrms: string[] = record.secondaryVrms ? [...record.secondaryVrms] : [];
    secondaryVrms.push(record.primaryVrm!);
  return secondaryVrms;
  }
}

