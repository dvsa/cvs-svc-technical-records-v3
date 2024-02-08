import { TechRecordSearchSchema } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/search';
import { seedLocalTables, truncateLocalTables } from '../../../scripts';
import { API_URL } from '../../util';

describe('search function', () => {
  beforeAll(() => async () => {
    await seedLocalTables();
  });
  describe('happy path', () => {
    it('should find an existing record by VIN', async () => {
      const vin = 'DP76UMK4DQLTOT';
      const response = await fetch(`${API_URL}/search/${vin}?searchCriteria=vin`);

      expect(response.status).toBe(200);

      const json = await response.json() as TechRecordSearchSchema[];
      expect(json.every((record) => record.vin === vin)).toBe(true);
    }, 20000);

    it('should find an existing record (non-TRL) by primaryVrm', async () => {
      const primaryVrm = 'SJG3075';
      const response = await fetch(`${API_URL}/search/${primaryVrm}?searchCriteria=primaryVrm`);

      expect(response.status).toBe(200);

      const json = await response.json() as TechRecordSearchSchema[];
      expect(json.every((record) => record.primaryVrm === primaryVrm)).toBe(true);
    }, 20000);

    it('should find an existing record (TRL) by trailerId', async () => {
      const trailerId = 'C530005';
      const response = await fetch(`${API_URL}/search/${trailerId}?searchCriteria=trailerId`);

      expect(response.status).toBe(200);

      const json = await response.json() as TechRecordSearchSchema[];
      expect(json.every((record) => record.trailerId === trailerId)).toBe(true);
    }, 20000);

    it('should find an existing record by systemNumber', async () => {
      const systemNumber = 'XYZEP5JYOMM00020';
      const response = await fetch(`${API_URL}/search/${systemNumber}?searchCriteria=systemNumber`);

      expect(response.status).toBe(200);

      const json = await response.json() as TechRecordSearchSchema[];
      expect(json.every((record) => record.systemNumber === systemNumber)).toBe(true);
    }, 20000);
  });

  describe('unhappy path', () => {
    it('should return a 404 error response if the searchCriteria is correct, but no records exist matching that criteria', async () => {
      const response = await fetch(`${API_URL}/search/invalidvin123?searchCriteria=vin`);

      expect(response.status).toBe(404);

      await expect(response.json()).resolves.toEqual({
        errors: ['No records found matching identifier INVALIDVIN123 and criteria vin'],
      });
    }, 20000);

    it('should return a 400 error response if the searchCriteria is invalid', async () => {
      const response = await fetch(`${API_URL}/search/invalidvin123?searchCriteria=invalid`);

      expect(response.status).toBe(400);

      await expect(response.json()).resolves.toEqual({
        errors: ['Invalid search criteria'],
      });
    }, 20000);

    it('should return a 400 error response if the searchCriteria is correct, but the searchTerm is malformed', async () => {
      const searchTerm = 'averyveryveryveryveryveryveryverylongsearchidentifier';
      const response = await fetch(`${API_URL}/search/${searchTerm}?searchCriteria=vin`);

      expect(response.status).toBe(400);

      await expect(response.json()).resolves.toEqual({
        errors: ['The search identifier must be between 3 and 21 characters.'],
      });
    }, 20000);
  });

  afterAll(async () => {
    await truncateLocalTables();
  });
});
