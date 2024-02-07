import { APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';

import { RateLimit } from 'async-sema';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';

import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import invalidPrimaryVrmRecords from './resources/invalid-primary-vrms.json';
import {
  getBySystemNumberAndCreatedTimestamp,
  updateVehicle,
} from '../services/database';
import { ERRORS, StatusCode } from '../util/enum';
import { addHttpHeaders } from '../util/httpHeaders';
import { formatErrorMessage } from '../util/errorMessage';
import logger from '../util/logger';

export const handler = async (forceUpdateTimestamp?: Date): Promise<APIGatewayProxyResult> => {
  try {
    logger.debug('RPVRM: Remove Primary VRM for Trailers Called');

    const recordsToUpdate = invalidPrimaryVrmRecords.length;
    let numberOfRecordUpdated = 0;

    logger.debug(`RPVRM: ${recordsToUpdate} tech records to update`);

    const limit = RateLimit(25);
    // const techRecordChunks = chunk(invalidPrimaryVrmRecords, 25);

    for (const techRecord of invalidPrimaryVrmRecords) {
      await limit();

      const systemNumber = techRecord.system_number;
      const createdTimestamp = new Date(techRecord.createdAt).toISOString();
      const currentRecord = await getBySystemNumberAndCreatedTimestamp(
        systemNumber,
        createdTimestamp,
      );

      // Validate the state of the current (invalid) record.
      if (!validatePrimaryVrmIsInvalid(currentRecord)) {
        continue;
      }

      // Instantiate a new record from the current one and archive the existing record.
      const date = forceUpdateTimestamp ?? new Date();
      const [newRecord, recordToArchive] = archiveAndInstantiateNewTechRecord(currentRecord, date);

      // Update sucka
      const result = await updateVehicle([recordToArchive], [newRecord]) as TechRecordType<'get'>[];
      numberOfRecordUpdated += result.length;
    }

    return addHttpHeaders({
      statusCode: 200,
      body: `RPVRM: Updated ${numberOfRecordUpdated} invalid tech records`,
    });
  }
  catch {
    return addHttpHeaders({
      statusCode: 500,
      body: formatErrorMessage(ERRORS.FAILED_UPDATE_MESSAGE),
    });
  }
}

// Ensures that a technical record meets the criteria to be in an invalid state
// for the primary vrm data incident.
// Ultimately this ensures the vehicle is a trailer and has a primary vrm set.
const validatePrimaryVrmIsInvalid = (techRecord: TechRecordType<'get'>): boolean => {
  if (techRecord.techRecord_vehicleType !== 'trl') {
    logger.error(
      `RPVRM: Invalid tech record: type is not 'trl' (${techRecord.systemNumber}, ${techRecord.createdTimestamp})`
    );
    return false;
  }

  if (!('primaryVrm' in techRecord)) {
    logger.error(
      `RPVRM: Invalid tech record: missing primaryVrm (${techRecord.systemNumber}, ${techRecord.createdTimestamp})`
    );
    return false;
  }

  return true;
}

// Takes a technical record, updates it to archived and create a new instance from the input parameter
// with the primary vrm removed.
// Updates are made by SYSTEM_USER
const archiveAndInstantiateNewTechRecord = (currentRecord: TechRecordType<'get'>, updateDate: Date):
    [TechRecordType<'get'>, TechRecordType<'get'>] => {
  const SYSTEM_USER = 'SYSTEM USER';
  const REASON_FOR_CREATION = 'Primary VRM removed for trailer (CB2-10791)';

  const date = updateDate.toISOString();

  const newRecord = {
    ...currentRecord,
    primaryVrm: undefined,
    techRecord_reasonForCreation: REASON_FOR_CREATION
  };

  const recordToCreate = setCreatedAuditDetails(
    newRecord as TechRecordType<'get'>,
    SYSTEM_USER,
    SYSTEM_USER,
    date,
    currentRecord.techRecord_statusCode as StatusCode,
  );

  const recordToArchive = setLastUpdatedAuditDetails(
    currentRecord,
    SYSTEM_USER,
    SYSTEM_USER,
    date,
    StatusCode.ARCHIVED,
  );

  return [recordToCreate, recordToArchive];
}