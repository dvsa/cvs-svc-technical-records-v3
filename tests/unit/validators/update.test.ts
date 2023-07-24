import { ERRORS, STATUS } from '../../../src/util/enum';
import { checkStatusCodeValidity, validateUpdateErrors } from '../../../src/validators/update';

describe('validateUpdateErrors', () => {
  it('throws error if request body is empty', () => {
    expect(validateUpdateErrors('{}')).toEqual({
      statusCode: 400,
      body: ERRORS.MISSING_PAYLOAD,
    });
  });
  it('throws error if trying to update VIN', () => {
    const result = validateUpdateErrors(JSON.stringify({ vin: 'TestVin' }));
    expect(result).toEqual({
      statusCode: 400,
      body: ERRORS.INVALID_VIN_UPDATE,
    });
  });
  it('throws error if trying to update VRM or TrailerID', () => {
    expect(validateUpdateErrors(JSON.stringify({ primaryVrm: '132421' }))).toEqual({
      statusCode: 400,
      body: ERRORS.INVALID_VRM_UPDATE,
    });
    expect(validateUpdateErrors(JSON.stringify({ trailerId: '132421' }))).toEqual({
      statusCode: 400,
      body: ERRORS.INVALID_TRAILER_ID_UPDATE,
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
