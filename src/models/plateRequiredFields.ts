import { TechRecordType } from "@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type";

export const hgvRequiredFields: string[] = [
  'primaryVrm',
  'vin',
  'techRecord_brakes_dtpNumber',
  'techRecord_regnDate',
  'techRecord_manufactureYear',
  'techRecord_speedLimiterMrk',
  'techRecord_approvalType',
  'techRecord_approvalTypeNumber',
  'techRecord_variantNumber',
  'techRecord_make',
  'techRecord_model',
  'techRecord_functionCode',
  'techRecord_grossGbWeight',
  'techRecord_grossEecWeight',
  'techRecord_grossDesignWeight',
  'techRecord_trainGbWeight',
  'techRecord_trainEecWeight',
  'techRecord_trainDesignWeight',
  'techRecord_maxTrainGbWeight',
  'techRecord_maxTrainEecWeight',
  'techRecord_frontVehicleTo5thWheelCouplingMin',
  'techRecord_frontVehicleTo5thWheelCouplingMax',
  'techRecord_dimensions_length',
  'techRecord_dimensions_width',
  'techRecord_tyreUseCode',
  'techRecord_axles'
];

export const axleRequiredFields: string[] = [
  'weights_gbWeight',
  'weights_eecWeight',
  'weights_designWeight',
  'tyres_tyreSize',
  'tyres_plyRating',
  'tyres_fitmentCode'
];

export const trlRequiredFields: string[] = [
  'trailerId',
  'vin',
  'techRecord_brakes_dtpNumber',
  'techRecord_regnDate',
  'techRecord_manufactureYear',
  'techRecord_maxLoadOnCoupling',
  'techRecord_approvalType',
  'techRecord_approvalTypeNumber',
  'techRecord_variantNumber',
  'techRecord_make',
  'techRecord_model',
  'techRecord_functionCode',
  'techRecord_grossGbWeight',
  'techRecord_grossEecWeight',
  'techRecord_grossDesignWeight',
  'techRecord_couplingCenterToRearTrlMax',
  'techRecord_couplingCenterToRearTrlMin',
  'techRecord_dimensions_length',
  'techRecord_dimensions_width',
  'techRecord_tyreUseCode',
  'techRecord_axles'
];

export type HgvOrTrl = TechRecordType<'hgv'> | TechRecordType<'trl'>;