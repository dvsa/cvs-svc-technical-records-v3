import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { isPSV } from '../util/vehicle-type-narrowing';

export const updateNotes = (reasonForArchiving: string, updatedRecord: TechRecordType<'get'>, record: TechRecordType<'get'>): void => {
  if (isPSV(updatedRecord) && isPSV(record)) {
    updatedRecord.techRecord_remarks = record.techRecord_remarks
      ? `${record.techRecord_remarks} \n${reasonForArchiving}`
      : reasonForArchiving;
  } else if (!isPSV(updatedRecord) && !isPSV(record)) {
    updatedRecord.techRecord_notes = record.techRecord_notes
      ? `${record.techRecord_notes} \n${reasonForArchiving}`
      : reasonForArchiving;
  }
};
