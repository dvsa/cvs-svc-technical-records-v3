import { TechRecordSearchSchema } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/search';

describe('search function', () => {
  describe('happy path', () => {
    it('should find a record', async () => {
      const vin = 'DP76UMK4DQLTOT';
      const response = await fetch(`http:/127.0.0.1:3000/v3/technical-records/search/${vin}?searchCriteria=vin`);

      expect(response.status).toBe(200);
      const json = await response.json() as TechRecordSearchSchema[];
      expect(json.every((result) => result.vin === vin)).toBe(true);
    });
  });

  describe('unhappy path', () => {
    it('should return not found', async () => {
      const response = await fetch('http:/127.0.0.1:3000/v3/technical-records/search/invalidvin123?searchCriteria=vin');

      expect(response.status).toBe(404);
      const json = await response.json() as unknown;
      expect(json).toEqual({ errors: ['No records found matching identifier INVALIDVIN123 and criteria vin'] });
    });

    it('should return an error if the search criteria is invalid', async () => {
      const response = await fetch('http:/127.0.0.1:3000/v3/technical-records/search/invalidvin123?searchCriteria=foobar');

      expect(response.status).toBe(400);
      const json = await response.json() as unknown;
      expect(json).toEqual({ errors: ['Invalid search criteria'] });
    });

    it('should return an error if the search identifier is invalid', async () => {
      const response = await fetch(
        'http:/127.0.0.1:3000/v3/technical-records/search/averyveryveryveryveryveryveryverylongsearchidentifier?searchCriteria=vin',
      );

      expect(response.status).toBe(400);
      const json = await response.json() as unknown;
      expect(json).toEqual({ errors: ['The search identifier must be between 3 and 21 characters.'] });
    });
  });
});
