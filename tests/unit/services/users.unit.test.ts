import {getUserDetails, UserDetails} from '../../../src/services/user';
import {ERRORS} from '../../../src/util/enum';

describe('Test User Service', () => {
  describe('Should process user details and return them', () => {
    it('should successfully process a jwt token and return the relevant fields', () => {
      const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const payload = 'eyJuYW1lIjoiSm9obiBEb2UiLCJvaWQiOjE1MTYyMzkwMjJ9';
      const signature = 'n_aQxbA3-fsgfEdIMS61YGu-u8flaPYESJxRuaFzEXc';
      const res: UserDetails = getUserDetails(`${header}.${payload}.${signature}`);
      expect(res.username)
        .toBe('John Doe');
    });
    it('should throw an error if user details are missing', () => {
      const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const payload = 'eyJvaWQiOjE1MTYyMzkwMjJ9';
      const signature = 'OeYj2GlIUPh1y-xb6UMvq5m8V_nPFX5D_sBA4Fcnmz8';

      expect(() => getUserDetails(`${header}.${payload}.${signature}`))
        .toThrow(ERRORS.MISSING_USER_DETAILS);
    });
  });

  describe('Should override with system user when the environment variable is set', () => {
    beforeEach(() => {
      process.env.ENABLE_SYSTEM_USER_IMPERSONATION = undefined;
    });

    afterEach(() => {
      process.env.ENABLE_SYSTEM_USER_IMPERSONATION = undefined;
    });

    it('should successfully get the system user', () => {
      process.env.ENABLE_SYSTEM_USER_IMPERSONATION = 'true';

      const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const payload = 'eyJvaWQiOjE1MTYyMzkwMjJ9';
      const signature = 'OeYj2GlIUPh1y-xb6UMvq5m8V_nPFX5D_sBA4Fcnmz8';

      const res: UserDetails = getUserDetails(`${header}.${payload}.${signature}`);

      expect(res.username)
        .toBe('SYSTEM_USER');
      expect(res.email)
        .toBe('SYSTEM_USER');
    });

    it('should throw an error if the environment variable is not set', () => {
      console.log('process.env.ENABLE_SYSTEM_USER_IMPERSONATION', process.env.ENABLE_SYSTEM_USER_IMPERSONATION);
      const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const payload = 'eyJvaWQiOjE1MTYyMzkwMjJ9';
      const signature = 'OeYj2GlIUPh1y-xb6UMvq5m8V_nPFX5D_sBA4Fcnmz8';

      expect(() => getUserDetails(`${header}.${payload}.${signature}`))
        .toThrow(ERRORS.MISSING_USER_DETAILS);
    });
  });

  describe('Should override with ATI system user when the ATI environment variable is set', () => {
    beforeEach(() => {
      process.env.ATI_APP_ID = undefined;
    });

    afterEach(() => {
      process.env.ATI_APP_ID = undefined;
    });

    it('should successfully get the system user', () => {
      process.env.ATI_APP_ID = 'app-id-123';

      // eslint-disable-next-line max-len
      const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqd3QtYnVpbGRlciIsImlhdCI6MTczNDM2NTcyMywiZXhwIjoxNzY1OTAxNzIzLCJhdWQiOiJzb21lLWF1ZCIsInN1YiI6InNvbWUtc3ViIiwiYXBwaWQiOiJhcHAtaWQtMTIzIiwib2lkIjoib2lkLTEyMyIsImVtYWlsIjoic29tZW9uZUBzb21ld2hlcmUuY29tIn0.itSUmFZOGP6sVAGXzr3rCpTTNd9kL5UB7qou__2EVdI';

      const res: UserDetails = getUserDetails(jwt);

      expect(res.username)
        .toBe('ATI_SYSTEM_USER');
      expect(res.email)
        .toBe('ATI_SYSTEM_USER');
    });
  });
});
