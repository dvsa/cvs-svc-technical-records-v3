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
}

export enum STATUS {
  ARCHIVED = 'archived',
  CURRENT = 'current',
  PROVISIONAL = 'provisional',
  PROVISIONAL_OVER_CURRENT = 'provisional_over_current',
  ALL = 'all',
}

export enum ERRORS {
  NOTIFY_CONFIG_NOT_DEFINED = 'The Notify config is not defined in the config file.',
  DYNAMO_DB_CONFIG_NOT_DEFINED = 'DynamoDB config is not defined in the config file.',
  LAMBDA_INVOKE_CONFIG_NOT_DEFINED = 'Lambda Invoke config is not defined in the config file.',
  EVENT_IS_EMPTY = 'Event is empty',
  NO_BRANCH = 'Please define BRANCH environment variable',
  NO_UNIQUE_RECORD = 'Failed to uniquely identify record',
  TRAILER_ID_GENERATION_FAILED = 'TrailerId generation failed!',
  SYSTEM_NUMBER_GENERATION_FAILED = 'System Number generation failed!',
  Z_NUMBER_GENERATION_FAILED = 'Z Number generation failed!',
  T_NUMBER_GENERATION_FAILED = 'T Number generation failed!',
  CANNOT_UPDATE_ARCHIVED_RECORD = 'You are not allowed to update an archived tech-record',
  CANNOT_USE_UPDATE_TO_ARCHIVE = 'Cannot use update API to archive tech record',
  CANNOT_ARCHIVE_CHANGED_RECORD = 'Cannot archive tech record with attribute changes',
  CURRENT_OR_PROVISIONAL_RECORD_FOUND = 'Has existing Current or Provisional record',
  CANNOT_CHANGE_CURRENT_TO_PROVISIONAL = 'Cannot change current status to provisional',
  STATUS_CODE_SHOULD_BE_PROVISIONAL = 'Status code should be provisional',
  MISSING_PAYLOAD = 'Missing payload!',
  MISSING_USER = 'Microsoft user details not provided',
  MISSING_REASON_FOR_ARCHIVING = 'Reason for archiving not provided',
  VEHICLE_TYPE_ERROR = '"vehicleType" must be one of [hgv, psv, trl, lgv, car, motorcycle]',
  INVALID_PRIMARY_SECONDARY_VRM = 'Primary or secondaryVrms are not valid',
  INVALID_PRIMARY_VRM = 'Invalid primary VRM',
  INVALID_SECONDARY_VRM = 'Secondary VRMs are invalid',
  INVALID_TRAILER_ID = 'TrailerId is invalid',
  INVALID_BODY_TYPE = 'Invalid body type code',
  INVALID_VEHICLE_CLASS = 'Invalid vehicle class code',
  INVALID_VEHICLE_TYPE = '"vehicleType" must be one of [hgv, psv, trl, lgv, car, motorcycle]',
  MISSING_AUTH_HEADER = 'Missing authorization header',
}

export enum UpdateType {
  ADR = 'adrUpdate',
  TECH_RECORD_UPDATE = 'techRecordUpdate',
}
