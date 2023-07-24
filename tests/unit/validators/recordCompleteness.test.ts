import { validateAndComputeRecordCompleteness } from '../../../src/validators/recordCompleteness';
import hgvData from '../../resources/techRecordHGVPost.json';
import * as expectedRecords from '../../resources/tech-records-with-arrays.json';
import { TechrecordPut } from '../../../src/models/post';
import { RecordCompleteness } from '../../../src/util/enum';

describe('validateAndComputeRecordCompleteness', () => {
  it('should return correct record completeness', () => {
    expect(validateAndComputeRecordCompleteness(expectedRecords[0] as unknown as TechrecordPut)).toEqual(RecordCompleteness.SKELETON);
    expect(validateAndComputeRecordCompleteness(hgvData as TechrecordPut)).toEqual(RecordCompleteness.COMPLETE);
  });
  it('should remove any random fields from the input', () => {
    const mockHgvData = { ...hgvData, randomField: 'Test' };
    expect(validateAndComputeRecordCompleteness(mockHgvData as TechrecordPut)).toEqual(RecordCompleteness.COMPLETE);
    expect(mockHgvData).toEqual(hgvData);
    expect(mockHgvData).not.toHaveProperty('randomField');
  });
});
