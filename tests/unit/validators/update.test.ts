import { ERRORS, STATUS } from '../../../src/util/enum';
import { checkStatusCodeValidity, checkVinValidity, validateUpdateErrors } from '../../../src/validators/update';

describe('validateUpdateErrors', () => {
  it('throws error if request body is empty', () => {
    expect(validateUpdateErrors('{}')).toEqual({
      statusCode: 400,
      body: ERRORS.MISSING_PAYLOAD,
    });
  });
  it('returns false if no errors', () => {
    expect(validateUpdateErrors(JSON.stringify({ techRecord_emissionsLimit: '12' }))).toBe(false);
  });
});

describe('checkStatusCodeValidity', () => {
  it('throws error if trying to update archived record', () => {
    expect(checkStatusCodeValidity(STATUS.ARCHIVED)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD,
    });
  });
  it('throws error if trying to archive a record', () => {
    expect(checkStatusCodeValidity(undefined, STATUS.ARCHIVED)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_USE_UPDATE_TO_ARCHIVE,
    });
  });
  it('throws error if trying make current record provisional', () => {
    expect(checkStatusCodeValidity(STATUS.CURRENT, STATUS.PROVISIONAL)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_CHANGE_CURRENT_TO_PROVISIONAL,
    });
  });
  it('returns false if there are no errors', () => {
    expect(checkStatusCodeValidity(STATUS.CURRENT, STATUS.CURRENT)).toBe(false);
    expect(checkStatusCodeValidity(STATUS.PROVISIONAL, STATUS.CURRENT)).toBe(false);
    expect(checkStatusCodeValidity(STATUS.PROVISIONAL, STATUS.PROVISIONAL)).toBe(false);
  });
});

describe('checkVinValidity', () => {
  it('throws error if new vin is invalid', () => {
    expect(checkVinValidity('1234', '12')).toEqual({
      statusCode: 400,
      body: ERRORS.VIN_ERROR,
    });
    expect(checkVinValidity('1234', '123456789123456789123456789')).toEqual({
      statusCode: 400,
      body: ERRORS.VIN_ERROR,
    });
    expect(checkVinValidity('1234', '')).toEqual({
      statusCode: 400,
      body: ERRORS.VIN_ERROR,
    });
  });
  it('should return an error if newVin contains special characters', () => {
    const result = checkVinValidity('12345', '!newvin');
    expect(result).toEqual({
      statusCode: 400,
      body: ERRORS.VIN_ERROR,
    });
  });
  it('returns false if no errors', () => {
    expect(checkVinValidity('1234', '1234')).toBe(false);
    expect(checkVinValidity('1234', '12345')).toBe(false);
    expect(checkVinValidity('1234', undefined)).toBe(false);
    expect(checkVinValidity('1234', null)).toBe(false);
  });
});
