/* eslint-disable import/first */
import {
  generateSystemNumber,
  generateTNumber,
  generateTrailerId,
  generateZNumber,
} from '../../../src/services/testNumber';

const mockPostTechRecords = jest.fn();

jest.mock('../../../src/services/database.ts', () => ({
  postTechRecord: mockPostTechRecords,
}));

describe('Test test Number Service', () => {
  process.env.AWS_SAM_LOCAL = 'true';
  describe('Successful response', () => {
    it('should return a system number', async () => {
      const result = await generateSystemNumber();
      expect(result).toBe('123');
    });
    it('should return a trailerId number', async () => {
      const result = await generateTrailerId();
      expect(result).toBe('123');
    });
    it('should return a Z number', async () => {
      const result = await generateZNumber();
      expect(result).toBe('123');
    });
    it('should return a T number', async () => {
      const result = await generateTNumber();
      expect(result).toBe('123');
    });
  });
});
