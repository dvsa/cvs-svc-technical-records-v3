import { validateUpdateStatus } from '../../../src/validators/statusUpdate';

describe('validateUpdateStatus', () => {
  it('should return false if condition is not satisfied', () => {
    expect(validateUpdateStatus('submitted', 'fail', '41')).toBeFalsy();
    expect(validateUpdateStatus('submitted', 'pass', '10')).toBeFalsy();
    expect(validateUpdateStatus('test', 'pass', '41')).toBeFalsy();
  });
  it('should return true if condition is satisfied', () => {
    expect(validateUpdateStatus('submitted', 'pass', '41')).toBeTruthy();
    expect(validateUpdateStatus('submitted', 'prs', '41')).toBeTruthy();
    expect(validateUpdateStatus('submitted', 'prs', '47')).toBeTruthy();
  });
});
