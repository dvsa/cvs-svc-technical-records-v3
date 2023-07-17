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

export enum Status {
  ARCHIVED = 'archived',
  CURRENT = 'current',
  PROVISIONAL = 'provisional',
  PROVISIONAL_OVER_CURRENT = 'provisional_over_current',
  ALL = 'all'
}
