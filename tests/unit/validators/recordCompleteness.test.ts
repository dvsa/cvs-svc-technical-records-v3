import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { HttpMethod, RecordCompleteness } from '../../../src/util/enum';
import { validateAndComputeRecordCompleteness } from '../../../src/validators/recordCompleteness';
import hgvData from '../../resources/techRecordHGVPost.json';

describe('validateAndComputeRecordCompleteness', () => {
  it('should return correct record completeness', () => {
    expect(validateAndComputeRecordCompleteness({ techRecord_vehicleType: 'car' } as unknown as TechRecordType<'put'>, HttpMethod.GET)).toEqual(RecordCompleteness.SKELETON);
    expect(validateAndComputeRecordCompleteness(hgvData as TechRecordType<'put'>, HttpMethod.GET)).toEqual(RecordCompleteness.COMPLETE);
  });
  it('should remove any random fields from the input', () => {
    const mockHgvData = { ...hgvData, randomField: 'Test' };
    expect(validateAndComputeRecordCompleteness(mockHgvData as TechRecordType<'put'>, HttpMethod.GET)).toEqual(RecordCompleteness.COMPLETE);
    expect(mockHgvData).toEqual(hgvData);
    expect(mockHgvData).not.toHaveProperty('randomField');
  });
  it('should remove GET related fields from the input if using PUT method', () => {
    const mockHgvData = { ...hgvData, randomField: 'Test' };
    expect(validateAndComputeRecordCompleteness(mockHgvData as TechRecordType<'put'>, HttpMethod.PUT)).toEqual(RecordCompleteness.COMPLETE);
    expect(mockHgvData).not.toHaveProperty('createdTimestamp');
    expect(mockHgvData).not.toHaveProperty('randomField');
  });
});
