import { getUserDetails, UserDetails } from '../../../src/services/user';

describe('Test User Service', () => {
  describe('Should process user details and return them', () => {
    it('should successfully process a jwt token and return the relevant fields', () => {
      const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9';
      const payload = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYifQ';
      const signature = 'DUmbnmFG6y-AxpT578vTwVeHoT04LyAwcdhDdvxby_A';
      const res : UserDetails = getUserDetails(`${header}.${payload}.${signature}`);
      expect(res.username).toBe('John Doe');
    });
  });
});

