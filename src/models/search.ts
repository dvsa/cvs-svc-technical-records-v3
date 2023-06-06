export enum SearchCriteria {
  ALL = 'all',
  VIN = 'vin',
  PRIMARYVRM = 'primaryVrm',
  PARTIALVIN = 'partialVin',
  TRAILERID = 'trailerId',
  SYSTEM_NUMBER = 'systemNumber',
}

export type TableIndexes = 'VRMIndex' | 'TrailerIdIndex' | 'PartialVinIndex' | 'VinIndex' | 'SysNumIndex';
export interface SearchResult {
  systemNumber: string
  createdTimestamp: string
  vin: string
  primaryVrm?: string
  trailerId?: string
  techRecord_vehicleType: string
  techRecord_manufactureYear?: number | null
  techRecord_chassisMake?: string
  techRecord_chassisModel?: string
  techRecord_make?: string
  techRecord_model?: string,
  techRecord_statusCode?: string
}
