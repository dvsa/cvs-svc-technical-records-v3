import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';

export const isTRL = (record: TechRecordType<'get'> | TechRecordType<'put'>): record is TechRecordTypeByVehicle<'trl'> => record.techRecord_vehicleType === 'trl';
export const isPSV = (record: TechRecordType<'get'> | TechRecordType<'put'>): record is TechRecordTypeByVehicle<'psv'> => record.techRecord_vehicleType === 'psv';
export const isHGV = (record: TechRecordType<'get'> | TechRecordType<'put'>): record is TechRecordTypeByVehicle<'hgv'> => record.techRecord_vehicleType === 'hgv';
export const isLGV = (record: TechRecordType<'get'> | TechRecordType<'put'>): record is TechRecordTypeByVehicle<'lgv'> => record.techRecord_vehicleType === 'lgv';
export const isCar = (record: TechRecordType<'get'> | TechRecordType<'put'>): record is TechRecordTypeByVehicle<'car'> => record.techRecord_vehicleType === 'car';
export const isMotorcycle = (record: TechRecordType<'get'> | TechRecordType<'put'>): record is TechRecordTypeByVehicle<'motorcycle'> => record.techRecord_vehicleType === 'motorcycle';
