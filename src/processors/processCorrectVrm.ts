import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyResult } from 'aws-lambda';
import { SearchCriteria } from '../models/search';
import { correctVrm, searchByCriteria } from '../services/database';
import { UserDetails } from '../services/user';
import { StatusCode } from '../util/enum';
import { formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';

export const processCorrectVrm = async (
  currentRecord: TechRecordType<'get'>,
  userDetails: UserDetails,
  newVrm: string,
): Promise<APIGatewayProxyResult> => {
  const techRecords = await searchByCriteria(SearchCriteria.PRIMARYVRM, newVrm);
  const filteredVrm = techRecords.filter((x) => x.primaryVrm === newVrm && x.techRecord_statusCode !== StatusCode.ARCHIVED);
  if (filteredVrm.length) {
    return addHttpHeaders({
      statusCode: 400,
      body: JSON.stringify(`Primary VRM ${newVrm} already exists`),
    });
  }
  logger.debug('identifier has been validated');

  const newRecord: TechRecordType<'get'> = { ...currentRecord };
  if (newRecord.techRecord_vehicleType !== 'trl') {
    newRecord.primaryVrm = newVrm.toUpperCase();
  }
  newRecord.techRecord_lastUpdatedAt = new Date().toISOString();
  newRecord.techRecord_lastUpdatedById = userDetails.msOid;
  newRecord.techRecord_lastUpdatedByName = userDetails.username;

  const correctedRecord = await correctVrm(newRecord);

  return addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify(formatTechRecord(correctedRecord)),
  });
};
