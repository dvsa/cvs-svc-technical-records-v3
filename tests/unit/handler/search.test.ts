/* eslint-disable import/first */
const mockGetSearchErrors = jest.fn();
const mockSearchByAll = jest.fn();
const mockSearchByCriteria = jest.fn();

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/search';

jest.mock('../../../src/validators/search.ts', () => ({
  getSearchErrors: mockGetSearchErrors,
}));
jest.mock('../../../src/services/database.ts', () => ({
  searchByCriteria: mockSearchByCriteria,
  searchByAll: mockSearchByAll,
}));

describe('Test Search Lambda Function', () => {
  const headers = { 'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT', 'Access-Control-Allow-Origin': '*' };
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('Error handling', () => {
    it('should return an error when the query parameters are invalid', async () => {
      mockGetSearchErrors.mockReturnValueOnce({ statusCode: 400, body: 'Missing vehicle search identifier' });
      const result = await handler({ pathParameters: { foo: 'undefined' } } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({ statusCode: 400, body: 'Missing vehicle search identifier', headers });
    });

    it('should return a 404 if no results are found', async () => {
      mockGetSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce([]);
      const result = await handler({ pathParameters: { searchIdentifier: '123456' } } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({ statusCode: 404, body: 'No records found matching identifier 123456 and criteria all', headers });
    });
  });

  describe('successful calls', () => {
    it('should return results when given a search criteria', async () => {
      mockGetSearchErrors.mockReturnValueOnce(null);
      mockSearchByCriteria.mockResolvedValueOnce(['record 1', 'record 2']);
      const result = await handler({ pathParameters: { searchIdentifier: '123456' }, queryStringParameters: { searchCriteria: 'systemNumber' } } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: '["record 1","record 2"]', headers });
    });

    it('should return results when not given a search criteria', async () => {
      mockGetSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce(['record 1', 'record 2']);
      const result = await handler({ pathParameters: { searchIdentifier: '123456' } } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: '["record 1","record 2"]', headers });
    });
  });
});
