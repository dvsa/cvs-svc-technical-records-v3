import { ERRORS, StatusCode } from '../../../src/util/enum';
import { checkStatusCodeValidity, validateUpdateErrors } from '../../../src/validators/update';

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
    expect(checkStatusCodeValidity(StatusCode.ARCHIVED)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD,
    });
  });
  it('throws error if trying to archive a record', () => {
    expect(checkStatusCodeValidity(undefined, StatusCode.ARCHIVED)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_USE_UPDATE_TO_ARCHIVE,
    });
  });
  it('throws error if trying make current record provisional', () => {
    expect(checkStatusCodeValidity(StatusCode.CURRENT, StatusCode.PROVISIONAL)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_CHANGE_CURRENT_TO_PROVISIONAL,
    });
  });
  it('returns false if there are no errors', () => {
    expect(checkStatusCodeValidity(StatusCode.CURRENT, StatusCode.CURRENT)).toBe(false);
    expect(checkStatusCodeValidity(StatusCode.PROVISIONAL, StatusCode.CURRENT)).toBe(false);
    expect(checkStatusCodeValidity(StatusCode.PROVISIONAL, StatusCode.PROVISIONAL)).toBe(false);
  });
});
