import { ERRORS } from '../../../src/util/enum';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { checkVinValidity } from '../../../src/validators/vinValidity';

describe('checkVinValidity', () => {
  it('throws error if new vin is invalid', () => {
    expect(checkVinValidity('1234', '12')).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.VIN_ERROR),
    });
    expect(checkVinValidity('1234', '123456789123456789123456789')).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.VIN_ERROR),
    });
    expect(checkVinValidity('1234', '')).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.VIN_ERROR),
    });
  });
  it('should return an error if newVin contains special characters', () => {
    const result = checkVinValidity('12345', '!newvin');
    expect(result).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.VIN_ERROR),
    });
  });
  it('returns false if no errors', () => {
    expect(checkVinValidity('1234', '1234')).toBe(false);
    expect(checkVinValidity('1234', '12345')).toBe(false);
    expect(checkVinValidity('1234', undefined)).toBe(false);
    expect(checkVinValidity('1234', null)).toBe(false);
  });
});
