/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockValidateSysNumTimestampPathParams = jest.fn();

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/get';

jest.mock('../../../src/validators/sysNumTimestamp.ts', () => ({
  validateSysNumTimestampPathParams: mockValidateSysNumTimestampPathParams,
}));
jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
}));

const headers = { 'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT', 'Access-Control-Allow-Origin': '*' };

describe('Test Get Lambda Function', () => {
  describe('Error handling', () => {
    it('should return an error when missing the system number', async () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce({ statusCode: 400, body: 'Missing system number' });
      const result = await handler({ pathParameters: { foo: 'undefined' } } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({ statusCode: 400, body: 'Missing system number', headers });
    });

    it('should return an error when missing the created timestamp', async () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce({ statusCode: 400, body: 'Missing created timestamp' });
      const result = await handler({ pathParameters: { foo: 'undefined' } } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({ statusCode: 400, body: 'Missing created timestamp', headers });
    });

    it('should return a 404 if no results are found', async () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(null);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({});
      const result = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({ statusCode: 404, body: 'No record found matching sysNum 123456 and timestamp 12345', headers });
    });
  });

  describe('Successful calls', () => {
    it('should return 200 and a record', async () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(null);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ foo: 'bar' });
      const result = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({ statusCode: 200, body: '{"foo":"bar"}', headers });
    });
  });
});
