import { validateUpdateADRErrors } from '../../../src/validators/updateADR';
import { ERRORS } from '../../../src/util/enum';

describe('validateUpdateADRErrors', () => {
  const validDate = '2023-04-13';
  const today = new Date().toISOString().slice(0, 10);
  const futureDate = '2999-01-01';

  it('should return error if requestBody is null', () => {
    const result = validateUpdateADRErrors(null);
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: [ERRORS.MISSING_PAYLOAD] }),
    });
  });

  it('should return error if requestBody is empty', () => {
    const result = validateUpdateADRErrors('');
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: [ERRORS.MISSING_PAYLOAD] }),
    });
  });

  it('should return error if parsedBody is empty object', () => {
    const result = validateUpdateADRErrors('{}');
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: [ERRORS.MISSING_PAYLOAD] }),
    });
  });

  it('should return error if adrApproved is not boolean', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: 'yes', receivedDate: validDate }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['adrApproved must be a boolean'] }),
    });
  });

  it('should return error if receivedDate is not a string', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: 20230413 }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Invalid receivedDate provided'] }),
    });
  });

  it('should return error if receivedDate is not in YYYY-MM-DD format', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: '13-04-2023' }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Invalid receivedDate provided'] }),
    });
  });

  it('should return error if receivedDate is in the future', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: futureDate }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['receivedDate cannot be in the future'] }),
    });
  });

  it('should return false for valid input', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: false, receivedDate: validDate }));
    expect(result).toBeFalsy();
  });

  it('should return false for valid input with today as receivedDate', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: today }));
    expect(result).toBeFalsy();
  });
});
