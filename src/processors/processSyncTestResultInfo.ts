import { EUVehicleCategory } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/euVehicleCategory.enum.js';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { SearchCriteria } from '../models/search';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../services/audit';
import { getBySystemNumberAndCreatedTimestamp, searchByCriteria, updateVehicle } from '../services/database';
import {
  ERRORS, ReasonForCreation, StatusCode, UpdateType,
} from '../util/enum';
import logger from '../util/logger';
import { validateUpdateStatus } from '../validators/statusUpdate';

export const syncTestResultInfo = async (
  systemNumber: string,
  testStatus: string,
  testResult: string,
  testTypeId: string,
  createdById: string,
  createdByName: string,
  euVehicleCategory: EUVehicleCategory | undefined,
) => {
  let updateNeeded = false;
  let euVehicleCategoryUpdateNeeded = false;

  const statusUpdateNeeded = validateUpdateStatus(
    testStatus,
    testResult,
    testTypeId,
  );

  const allRecords = await searchByCriteria(SearchCriteria.SYSTEM_NUMBER, systemNumber);
  if (!allRecords.length) {
    throw new Error(`${ERRORS.CANNOT_FIND_RECORD} with systemNumber ${systemNumber}`);
  }
  const nonArchivedRecords = allRecords.filter((record) => record.techRecord_statusCode !== StatusCode.ARCHIVED);
  if (!nonArchivedRecords.length) {
    throw new Error(ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD);
  }
  if (nonArchivedRecords.length > 2) {
    throw new Error(ERRORS.MORE_THAN_TWO_NON_ARCHIVED_TECH_RECORDS);
  }

  const provisionalRecord = nonArchivedRecords.find((record) => record.techRecord_statusCode === StatusCode.PROVISIONAL);
  const currentRecord = nonArchivedRecords.find((record) => record.techRecord_statusCode === StatusCode.CURRENT);

  const completeProvisionalRecord = provisionalRecord
    ? await getBySystemNumberAndCreatedTimestamp(provisionalRecord.systemNumber, provisionalRecord.createdTimestamp)
    : undefined;
  const completeCurrentRecord = currentRecord
    ? await getBySystemNumberAndCreatedTimestamp(currentRecord.systemNumber, currentRecord.createdTimestamp)
    : undefined;

  if (euVehicleCategory) {
    if (completeProvisionalRecord && completeCurrentRecord) {
      euVehicleCategoryUpdateNeeded = !(completeProvisionalRecord.techRecord_euVehicleCategory && completeCurrentRecord.techRecord_euVehicleCategory);
    } else {
      euVehicleCategoryUpdateNeeded = !!(
        (completeProvisionalRecord && !completeProvisionalRecord.techRecord_euVehicleCategory)
        || (completeCurrentRecord && !completeCurrentRecord.techRecord_euVehicleCategory)
      );
    }
  }

  const recordsToArchive = [];
  const newRecords = [];
  if (statusUpdateNeeded && completeProvisionalRecord) {
    updateNeeded = true;
    logger.info('Tech record status update');
    newRecords.push({ ...completeProvisionalRecord });
    recordsToArchive.push({ ...completeProvisionalRecord });
    if (completeCurrentRecord) recordsToArchive.push({ ...completeCurrentRecord });

    newRecords[0].techRecord_statusCode = StatusCode.CURRENT;
    newRecords[0].techRecord_reasonForCreation = ReasonForCreation.RECORD_PROMOTED;
    if (euVehicleCategoryUpdateNeeded && euVehicleCategory) {
      logger.info('EU vehicle category update');
      newRecords[0].techRecord_euVehicleCategory = euVehicleCategory;
      newRecords[0].techRecord_reasonForCreation = `${newRecords[0].techRecord_reasonForCreation} ${ReasonForCreation.EU_VEHICLE_CATEGORY_UPDATE}`;
    }
  } else if (euVehicleCategoryUpdateNeeded && euVehicleCategory) {
    updateNeeded = true;
    logger.info('EU vehicle category update');
    if (completeCurrentRecord) {
      recordsToArchive.push({ ...completeCurrentRecord });
      newRecords.push({
        ...completeCurrentRecord,
        techRecord_euVehicleCategory: euVehicleCategory,
        techRecord_reasonForCreation: ReasonForCreation.EU_VEHICLE_CATEGORY_UPDATE,
      });
    }
    if (completeProvisionalRecord) {
      recordsToArchive.push({ ...completeProvisionalRecord });
      newRecords.push({
        ...completeProvisionalRecord,
        techRecord_euVehicleCategory: euVehicleCategory,
        techRecord_reasonForCreation: ReasonForCreation.EU_VEHICLE_CATEGORY_UPDATE,
      });
    }
  }

  if (updateNeeded) {
    const updatedNewRecords: TechRecordType<'get'>[] = [];
    const updatedRecordsToArchive: TechRecordType<'get'>[] = [];
    newRecords.forEach((record) => {
      updatedNewRecords.push(setCreatedAuditDetails(
        record as TechRecordType<'get'>,
        createdByName,
        createdById,
        new Date().toISOString(),
        record.techRecord_statusCode as StatusCode,
      ));
    });
    recordsToArchive.forEach((record) => {
      record.techRecord_updateType = UpdateType.TECH_RECORD_UPDATE;
      updatedRecordsToArchive.push(setLastUpdatedAuditDetails(record, createdByName, createdById, new Date().toISOString(), StatusCode.ARCHIVED));
    });

    return updateVehicle(
      updatedRecordsToArchive,
      updatedNewRecords,
    );
  }
  logger.info('Update not required');
  return undefined;
};
