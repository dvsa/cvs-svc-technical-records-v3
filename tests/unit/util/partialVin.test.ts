import { createPartialVin } from '../../../src/util/partialVin';

describe('partial vins', () => {
  it('should return the whole vin', () => {
    const vin = 'abc12';
    const result = createPartialVin(vin);
    expect(result).toBe('ABC12');
  });

  it('should return a substring of the vin', () => {
    const vin = 'abc123456789def';
    const result = createPartialVin(vin);

    expect(result).toBe('789DEF');
  });
});