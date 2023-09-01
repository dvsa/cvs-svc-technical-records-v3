import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';

export const updateNotes = (reasonForArchiving: string, updatedRecord: TechRecordType<'get'>, record: TechRecordType<'get'>): void => {
  if (updatedRecord.techRecord_vehicleType === 'psv' && record.techRecord_vehicleType === 'psv') {
    updatedRecord.techRecord_remarks = record.techRecord_remarks
      ? `${record.techRecord_remarks} \n${reasonForArchiving}`
      : reasonForArchiving;
  } else if (updatedRecord.techRecord_vehicleType !== 'psv' && record.techRecord_vehicleType !== 'psv') {
    updatedRecord.techRecord_notes = record.techRecord_notes
      ? `${record.techRecord_notes} \n${reasonForArchiving}`
      : reasonForArchiving;
  }
};
