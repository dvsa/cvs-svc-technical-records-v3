/* eslint-disable import/first */
const mockValidateSearchErrors = jest.fn();
const mockSearchByAll = jest.fn();
const mockSearchByCriteria = jest.fn();

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/search';
import { formatErrorMessage } from '../../../src/util/errorMessage';

jest.mock('../../../src/validators/search.ts', () => ({
  validateSearchErrors: mockValidateSearchErrors,
}));
jest.mock('../../../src/services/database.ts', () => ({
  searchByCriteria: mockSearchByCriteria,
  searchByAll: mockSearchByAll,
}));
const headers = {
  'Access-Control-Allow-Headers':
'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Origin': '*',
};

describe('Test Search Lambda Function', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('Error handling', () => {
    it('should return an error when the query parameters are invalid', async () => {
      mockValidateSearchErrors.mockReturnValueOnce({ statusCode: 400, body: formatErrorMessage('Missing vehicle search identifier') });
      const result = await handler({ pathParameters: { foo: 'undefined' } } as unknown as APIGatewayProxyEvent);
      expect(mockValidateSearchErrors).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 400, body: formatErrorMessage('Missing vehicle search identifier'), headers });
    });

    it('should return a 404 if no results are found', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce([]);
      const result = await handler({ pathParameters: { searchIdentifier: '123456' } } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({ statusCode: 404, body: formatErrorMessage('No records found matching identifier 123456 and criteria all'), headers });
    });
  });

  describe('successful calls', () => {
    it('should return results when given a search criteria', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByCriteria.mockResolvedValueOnce(['record 1', 'record 2']);
      const result = await handler({
        pathParameters: { searchIdentifier: '123456' },
        queryStringParameters: { searchCriteria: 'systemNumber' },
      } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: '["record 1","record 2"]', headers });
    });

    it('should return results when not given a search criteria', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce(['record 1', 'record 2']);
      const result = await handler({ pathParameters: { searchIdentifier: '123456' } } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: '["record 1","record 2"]', headers });
    });

    it('should capitalise the searchIdentifier', async () => {
      const searchIdentifier = 'a lower case string';
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce(['record 1', 'record 2']);
      const result = await handler({ pathParameters: { searchIdentifier } } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByAll).toHaveBeenCalledTimes(1);
      expect(mockSearchByAll).toHaveBeenLastCalledWith(searchIdentifier.toUpperCase());
      expect(result).toEqual({ statusCode: 200, body: '["record 1","record 2"]', headers });
    });
  });
});
