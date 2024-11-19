import { validateSingleVin } from '../../../src/validators/recalls';

describe('validateSingleVin', () => {
  it('should validate a correct vin', () => {
    const vin = 'V123456789';
    const res = validateSingleVin(vin);
    expect(res).toBe(true);
  });
  it('should error a undefined vin', () => {
    const vin = undefined;
    const res = validateSingleVin(vin as unknown as string);
    expect(res).toBe(false);
  });
  it('should error a null vin', () => {
    const vin = null;
    const res = validateSingleVin(vin as unknown as string);
    expect(res).toBe(false);
  });
  it('should error a 2 char vin', () => {
    const vin = 'V1';
    const res = validateSingleVin(vin);
    expect(res).toBe(false);
  });
  it('should error a 18 char vin', () => {
    const vin = 'V12345678989497453543543345';
    const res = validateSingleVin(vin);
    expect(res).toBe(false);
  });
  it('should error a non string vin', () => {
    const vin = 123456;
    const res = validateSingleVin(vin as unknown as string);
    expect(res).toBe(false);
  });
  it('should error a vin that has a special char in', () => {
    const vin = 'V123456789+';
    const res = validateSingleVin(vin);
    expect(res).toBe(false);
  });
  it('should error a Q vin', () => {
    const vin = 'V123456789Q';
    const res = validateSingleVin(vin);
    expect(res).toBe(false);
  });
  it('should error a I vin', () => {
    const vin = 'V123456789I';
    const res = validateSingleVin(vin);
    expect(res).toBe(false);
  });
  it('should error a O vin', () => {
    const vin = 'V123456789O';
    const res = validateSingleVin(vin);
    expect(res).toBe(false);
  });
});
