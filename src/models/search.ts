import { TechRecordSearchSchema } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/search';

export enum SearchCriteria {
  ALL = 'all',
  VIN = 'vin',
  PRIMARYVRM = 'primaryVrm',
  PARTIALVIN = 'partialVin',
  TRAILERID = 'trailerId',
  SYSTEM_NUMBER = 'systemNumber',
}

export type TableIndexes = 'VRMIndex' | 'TrailerIdIndex' | 'PartialVinIndex' | 'VinIndex' | 'SysNumIndex';
export type SearchResult = TechRecordSearchSchema;
