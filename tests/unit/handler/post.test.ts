/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const mockPostTechRecord = jest.fn();
jest.mock('../../../src/services/database.ts', () => ({
  postTechRecord: mockPostTechRecord,
}));
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler, processRequest } from '../../../src/handler/post';
import postCarData from '../../resources/techRecordCarPost.json';
import postTrlData from '../../resources/techRecordsTrlPost.json';

describe('Test Post Lambda Function', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  describe('Successful response', () => {
    it('should not return an error when attempting to post a car', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      mockPostTechRecord.mockResolvedValueOnce(postCarData);
      const result = await handler({ body: JSON.stringify(postCarData) } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);
    });

    it('should not return an error when attempting to post a trl', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      postTrlData.trailerId = '';
      mockPostTechRecord.mockResolvedValueOnce(postCarData);
      const result = await handler({ body: JSON.stringify(postTrlData) } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);
    });

    it('should not return an error when attempting to post a small trl', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      mockPostTechRecord.mockResolvedValueOnce(postCarData);
      postTrlData.trailerId = '';
      postTrlData.techRecord_euVehicleCategory = 'o1';
      const result = await handler({ body: JSON.stringify(postTrlData) } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);
    });
  });
  describe('Error handling', () => {
    it('should return an error', async () => {
      const result = await handler(postCarData as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('Body is not a valid TechRecord');
    });

    it('should return 400 when event has no body', async () => {
      const result = await handler(postCarData as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('Failed to add record to DynamoDB');
    });
  });
  describe('testing helper method processRequest', () => {
    it('should return a request body and have changed the systemNumber for a car', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      const request = postCarData;
      request.primaryVrm = '';
      const res = await processRequest(request);
      expect(res.systemNumber).toBe('123');
    });
    it('should return a request body and have changed the trailer id for a trailer', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      const request = postTrlData;
      postTrlData.trailerId = '';
      const res = await processRequest(request);
      expect(res.trailerId).toBe('123');
    });
    it('should return a request body and have changed the trailer id for a small trailer o1', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      postTrlData.trailerId = '';
      postTrlData.techRecord_euVehicleCategory = 'o1';
      const request = postTrlData;
      const res = await processRequest(request);
      expect(res.trailerId).toBe('123');
    });

    it('should return a request body and have changed the trailer id for a small trailer o2', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      postTrlData.trailerId = '';
      postTrlData.techRecord_euVehicleCategory = 'o2';
      const request = postTrlData;
      const res = await processRequest(request);
      expect(res.trailerId).toBe('123');
    });
  });
});
