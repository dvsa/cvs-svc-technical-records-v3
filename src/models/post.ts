export enum SearchCriteria {
  ALL = 'all',
  VIN = 'vin',
  PRIMARYVRM = 'primaryVrm',
  PARTIALVIN = 'partialVin',
  TRAILERID = 'trailerId',
  SYSTEM_NUMBER = 'systemNumber',
}

export type TableIndexes = 'VRMIndex' | 'TrailerIdIndex' | 'PartialVinIndex' | 'VinIndex' | 'SysNumIndex';
export default interface MsUserDetails {
  msUser: string;
  msOid: string;
}
export interface PostCar {
  msUserDetails: MsUserDetails,
  createdTimestamp: string,
  partialVin: string,
  primaryVrm: string,
  secondaryVrms: string[],
  systemNumber: string,
  techRecord_applicantDetails_address1?: string | null,
  techRecord_applicantDetails_address2?: string | null,
  techRecord_applicantDetails_address3?: string | null,
  techRecord_applicantDetails_emailAddress?: string | null,
  techRecord_applicantDetails_name?: string | null,
  techRecord_applicantDetails_postCode?: string | null,
  techRecord_applicantDetails_postTown?: string | null,
  techRecord_applicantDetails_telephoneNumber?: string | null,
  techRecord_bodyType_code: string | null,
  techRecord_bodyType_description: number | null,
  techRecord_createdAt: string,
  techRecord_createdById: string,
  techRecord_createdByName: string,
  techRecord_euVehicleCategory: string,
  techRecord_lastUpdatedAt: string,
  techRecord_lastUpdatedById: string | null,
  techRecord_lastUpdatedByName: string | null,
  techRecord_make: string,
  techRecord_manufactureYear: string,
  techRecord_model: string,
  techRecord_noOfAxles: number,
  techRecord_numberOfWheelsDriven: string,
  techRecord_reasonForCreation: string,
  techRecord_recordCompleteness: string,
  techRecord_regnDate: string | null,
  techRecord_statusCode: string,
  techRecord_vehicleClass_code: string,
  techRecord_vehicleClass_description: string,
  techRecord_vehicleConfiguration: string,
  techRecord_vehicleSize: string,
  techRecord_vehicleSubclass_0: string,
  techRecord_vehicleType: string,
  vin: string
}
