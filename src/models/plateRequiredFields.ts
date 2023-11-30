import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';

export const hgvRequiredFields: string[] = [
  'primaryVrm',
  'vin',
  'techRecord_brakes_dtpNumber',
  'techRecord_regnDate',
  'techRecord_manufactureYear',
  'techRecord_speedLimiterMrk',
  'techRecord_variantNumber',
  'techRecord_make',
  'techRecord_model',
  'techRecord_functionCode',
  'techRecord_frontVehicleTo5thWheelCouplingMin',
  'techRecord_frontVehicleTo5thWheelCouplingMax',
  'techRecord_dimensions_length',
  'techRecord_dimensions_width',
  'techRecord_tyreUseCode',
  'techRecord_axles',
  'techRecord_roadFriendly',
  'techRecord_vehicleConfiguration',
];

export const tyreRequiredFields: string[] = [
  'tyres_tyreSize',
  'tyres_fitmentCode',
];

export const trlRequiredFields: string[] = [
  'trailerId',
  'vin',
  'techRecord_brakes_dtpNumber',
  'techRecord_manufactureYear',
  'techRecord_maxLoadOnCoupling',
  'techRecord_variantNumber',
  'techRecord_make',
  'techRecord_model',
  'techRecord_functionCode',
  'techRecord_couplingCenterToRearTrlMax',
  'techRecord_couplingCenterToRearTrlMin',
  'techRecord_dimensions_length',
  'techRecord_dimensions_width',
  'techRecord_tyreUseCode',
  'techRecord_axles',
  'techRecord_roadFriendly',
  'techRecord_vehicleConfiguration',
];

export type HgvOrTrl = TechRecordType<'hgv'> | TechRecordType<'trl'>;
