import { validateUpdateADRErrors } from '../../../src/validators/updateADR';
import { ERRORS } from '../../../src/util/enum';

describe('validateUpdateADRErrors', () => {
  const validDate = '2023-04-13';
  const today = new Date().toISOString().slice(0, 10);
  const futureDate = '2999-01-01';
  const applicationNumber = 'APP-0123456-0101-01';

  it('should return error if requestBody is null', () => {
    const result = validateUpdateADRErrors(null);
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: [ERRORS.MISSING_PAYLOAD] }),
    });
  });

  it('should return error if requestBody is empty string', () => {
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

  it('should return error if adrApproved is undefined', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ receivedDate: validDate, applicationNumber }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['payload missing adrApproved'] }),
    });
  });

  it('should return error if adrApproved is null', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: null, receivedDate: validDate, applicationNumber }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['payload missing adrApproved'] }),
    });
  });

  it('should return error if receivedDate is missing', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, applicationNumber }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['payload missing receivedDate'] }),
    });
  });

  it('should return error if applicationNumber is missing', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: validDate }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['payload missing applicationNumber'] }),
    });
  });

  it('should return error if applicationNumber is not in valid format', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: validDate, applicationNumber: '12345' }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Invalid applicationNumber provided'] }),
    });
  });

  it('should return error if receivedDate is not in YYYY-MM-DD format', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: '13-04-2023', applicationNumber }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['Invalid receivedDate provided'] }),
    });
  });

  it('should return error if receivedDate is in the future', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: futureDate, applicationNumber }));
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ errors: ['receivedDate cannot be in the future'] }),
    });
  });

  it('should return false for valid input with adrApproved false', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: false, receivedDate: validDate, applicationNumber }));
    expect(result).toBeFalsy();
  });

  it('should return false for valid input with adrApproved true', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: validDate, applicationNumber }));
    expect(result).toBeFalsy();
  });

  it('should return false for valid input with today as receivedDate', () => {
    const result = validateUpdateADRErrors(JSON.stringify({ adrApproved: true, receivedDate: today, applicationNumber }));
    expect(result).toBeFalsy();
  });
});
