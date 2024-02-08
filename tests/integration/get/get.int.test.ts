import { seedLocalTables, truncateLocalTables } from '../../../scripts';
import { API_URL } from '../../util';

describe('get', () => {
  beforeAll(async () => {
    await seedLocalTables();
  });
  describe('happy path', () => {
    it('should find a record given its systemNumber, and createdTimestamp', async () => {
      const systemNumber = 'XYZEP5JYOMM00020';
      const createdTimestamp = '2019-06-15T10:26:53.903Z';
      const response = await fetch(`${API_URL}/${systemNumber}/${createdTimestamp}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      await expect(response.json()).resolves.toEqual(expect.objectContaining({
        systemNumber,
        createdTimestamp,
      }));
    });
  });

  describe('unhappy path', () => {
    it('should return a 400 response, when provided with a malformed systemNumber', async () => {
      const response = await fetch(`${API_URL}/XYZEP5JYOMM00020/bar`);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ errors: ['Invalid created timestamp'] });
    });

    it('should return a 404 response, when the tech record does not exist', async () => {
      const systemNumber = 'ABC';
      const createdTimestamp = '2019-06-24T10:26:56.903Z';
      const response = await fetch(`${API_URL}/${systemNumber}/${createdTimestamp}`);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        errors: [`No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`],
      });
    });
  });

  afterAll(async () => {
    await truncateLocalTables();
  });
});
