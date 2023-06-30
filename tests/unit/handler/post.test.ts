/* eslint-disable import/first */
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/post';
import postCarData from '../../resources/techRecordCarPost.json';

describe('Test Post Lambda Function', () => {
  describe('Error handling', () => {
    it('should return an error when duplicated the system number', async () => {
      const result = await handler(postCarData as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('Failed to add record to DynamoDB');
    });
  });
});
