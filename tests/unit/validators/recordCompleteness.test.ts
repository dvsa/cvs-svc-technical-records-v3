import { TechRecordPut } from '../../../src/models/post';
import { HttpMethod, RecordCompleteness } from '../../../src/util/enum';
import { validateAndComputeRecordCompleteness } from '../../../src/validators/recordCompleteness';
import * as expectedRecords from '../../resources/tech-records-with-arrays.json';
import hgvData from '../../resources/techRecordHGVPost.json';

describe('validateAndComputeRecordCompleteness', () => {
  it('should return correct record completeness', () => {
    expect(validateAndComputeRecordCompleteness(expectedRecords[0] as unknown as TechRecordPut, HttpMethod.GET)).toEqual(RecordCompleteness.SKELETON);
    expect(validateAndComputeRecordCompleteness(hgvData as TechRecordPut, HttpMethod.GET)).toEqual(RecordCompleteness.COMPLETE);
  });
  it('should remove any random fields from the input', () => {
    const mockHgvData = { ...hgvData, randomField: 'Test' };
    expect(validateAndComputeRecordCompleteness(mockHgvData as TechRecordPut, HttpMethod.GET)).toEqual(RecordCompleteness.COMPLETE);
    expect(mockHgvData).toEqual(hgvData);
    expect(mockHgvData).not.toHaveProperty('randomField');
  });
  it('should remove GET related fields from the input if using PUT method', () => {
    const mockHgvData = { ...hgvData, randomField: 'Test' };
    expect(validateAndComputeRecordCompleteness(mockHgvData as TechRecordPut, HttpMethod.PUT)).toEqual(RecordCompleteness.COMPLETE);
    expect(mockHgvData).not.toHaveProperty('createdTimestamp');
    expect(mockHgvData).not.toHaveProperty('randomField');
  });
});
