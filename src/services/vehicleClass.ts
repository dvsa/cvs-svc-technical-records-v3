import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';

export const addVehicleClassCode = (record: TechRecordType<'get'>): void => {
  if ('techRecord_vehicleClass_description' in record) {
    const vehicleClassCodeMap = new Map<string, string>([
      ['3 wheelers', '3'],
      ['heavy goods vehicle', 'v'],
      ['large psv(ie: greater than 23 seats)', 'l'],
      ['MOT class 4', '4'],
      ['MOT class 5', '5'],
      ['MOT class 7', '7'],
      ['motorbikes over 200cc or with a sidecar', '2'],
      ['motorbikes up to 200cc', '1'],
      ['not applicable', 'n'],
      ['small psv (ie: less than or equal to 22 seats)', 's'],
      ['trailer', 't'],
    ]);

    record.techRecord_vehicleClass_code = vehicleClassCodeMap.get(record.techRecord_vehicleClass_description ?? '');
  }
};
