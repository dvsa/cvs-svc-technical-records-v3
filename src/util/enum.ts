export enum VehicleType {
  PSV = 'psv',
  TRL = 'trl',
  HGV = 'hgv',
  CAR = 'car',
  LGV = 'lgv',
  MOTORCYCLE = 'motorcycle',
}

export enum RecordCompleteness {
  COMPLETE = 'complete',
  TESTABLE = 'testable',
  SKELETON = 'skeleton',
}

export enum HttpMethod {
  PUT = 'put',
  GET = 'get',
}

export enum StatusCode {
  ARCHIVED = 'archived',
  CURRENT = 'current',
  PROVISIONAL = 'provisional',
}

export enum ERRORS {
  EVENT_IS_EMPTY = 'Event is empty',
  TRAILER_ID_GENERATION_FAILED = 'TrailerId generation failed!',
  SYSTEM_NUMBER_GENERATION_FAILED = 'System Number generation failed!',
  Z_NUMBER_GENERATION_FAILED = 'Z Number generation failed!',
  T_NUMBER_GENERATION_FAILED = 'T Number generation failed!',
  CANNOT_UPDATE_ARCHIVED_RECORD = 'Cannot update an archived record',
  CANNOT_USE_UPDATE_TO_ARCHIVE = 'Cannot use update API to archive tech record',
  CANNOT_ARCHIVE_CHANGED_RECORD = 'Cannot archive tech record with attribute changes',
  CANNOT_CHANGE_CURRENT_TO_PROVISIONAL = 'Cannot change current status to provisional',
  STATUS_CODE_SHOULD_BE_PROVISIONAL = 'Status code should be provisional',
  MISSING_PAYLOAD = 'Missing payload!',
  MISSING_USER_DETAILS = 'Missing user details',
  MISSING_REASON_FOR_ARCHIVING = 'Reason for archiving not provided',
  VEHICLE_TYPE_ERROR = '"vehicleType" must be one of [hgv, psv, trl, lgv, car, motorcycle]',
  MISSING_AUTH_HEADER = 'Missing authorization header',
  VIN_ERROR = 'New VIN is invalid',
  INVALID_VRM_UPDATE = 'Cannot use update API to update the VRM',
  INVALID_TRAILER_ID_UPDATE = 'Cannot use update API to update the trailer ID',
  MORE_THAN_TWO_NON_ARCHIVED_TECH_RECORDS = 'The vehicle has more than two non archived Tech records.',
  CANNOT_FIND_RECORD = 'Cannot find record',
}
export enum ReasonForCreation {
  EU_VEHICLE_CATEGORY_UPDATE = 'EU Vehicle Catergory updated.',
  RECORD_PROMOTED = 'Record promoted to current.',
}

export enum UpdateType {
  ADR = 'adrUpdate',
  TECH_RECORD_UPDATE = 'techRecordUpdate',
}
