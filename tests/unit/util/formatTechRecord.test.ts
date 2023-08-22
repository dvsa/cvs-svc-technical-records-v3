import { formatTechRecord } from '../../../src/util/formatTechRecord';
import * as expectedRecords from '../../resources/tech-records-with-arrays.json';
import * as flatRecords from '../../resources/technical-records-v3.json';

describe('test format of tech record', () => {
  it('should not do any changes if there is no arrays', () => {
    const inputRecord = flatRecords[5];
    const res = formatTechRecord(inputRecord);
    expect(res).toEqual(inputRecord);
  });

  it('should work with only a basic non nested array', () => {
    const inputRecord = flatRecords[4];
    const res = formatTechRecord(inputRecord);
    expect(res).toEqual(expectedRecords[0]);
  });

  it('should work with a simple axle array', () => {
    const inputRecord = flatRecords[1];
    const res = formatTechRecord(inputRecord);
    expect(res).toEqual(expectedRecords[1]);
  });

  it('should work with a more complex axle array', () => {
    const inputRecord = flatRecords[2];
    const res = formatTechRecord(inputRecord);
    expect(res).toEqual(expectedRecords[2]);
  });

  it('should work with a complex axle array and out of order plate array', () => {
    const inputRecord = flatRecords[3];
    const res = formatTechRecord(inputRecord);
    expect(res).toEqual(expectedRecords[3]);
  });

  it('should work with a complex axle array and out of order plate array and axle spacings', () => {
    const inputRecord = flatRecords[6];
    const res = formatTechRecord(inputRecord);
    expect(res).toEqual(expectedRecords[4]);
  });
});
