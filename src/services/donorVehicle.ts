import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyResult } from 'aws-lambda';
import { SearchCriteria } from '../models/search';
import { StatusCode } from '../util/enum';
import { validateVrm } from '../validators/update';
import { searchByCriteria, getBySystemNumberAndCreatedTimestamp } from './database';
import { addHttpHeaders } from '../util/httpHeaders';

export const donorVehicle = async (newVrm: string, newDonorVrm?: string) => {
  let err = {} as APIGatewayProxyResult;
  let donorVehicleRecord = {} as TechRecordType<'get'>;
  if (newDonorVrm) {
    const donorRecords = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm);
    const currentDonorRecordDetails = donorRecords.filter((x) => x.techRecord_statusCode === StatusCode.CURRENT);
    if (!currentDonorRecordDetails.length) {
      err = addHttpHeaders({
        statusCode: 400,
        body: `no vehicles with VRM ${newVrm} have a current record`,
      });
    } else {
      donorVehicleRecord = await getBySystemNumberAndCreatedTimestamp(
        currentDonorRecordDetails[0].systemNumber,
        currentDonorRecordDetails[0].createdTimestamp,
      );
    }

    const donorVrmsNotIncorrectFormat = validateVrm(donorVehicleRecord, newDonorVrm);
    if (donorVrmsNotIncorrectFormat) {
      err = addHttpHeaders(donorVrmsNotIncorrectFormat);
    }
  }
  return [donorVehicleRecord, err];
};
