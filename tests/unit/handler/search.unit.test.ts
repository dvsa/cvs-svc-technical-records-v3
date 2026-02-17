/* eslint-disable import/first */
const mockValidateSearchErrors = jest.fn();
const mockSearchByAll = jest.fn();
const mockSearchByCriteria = jest.fn();

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { VehicleType } from '@dvsa/cvs-type-definitions/types/v1/enums/vehicleType.enum';
import { handler } from '../../../src/handler/search';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { SearchResult } from '../../../src/models/search';
import { StatusCode } from '../../../src/util/enum';

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

const mockSearchResponse = [
  {
    primaryVrm: 'AB12CDE',
    vin: '1HGCM82633A004352',
    techRecord_statusCode: StatusCode.CURRENT,
    techRecord_vehicleType: VehicleType.TRL,
    createdTimestamp: '2026-01-01T12:00:000Z',
    trailerId: 'TRL00001',
    systemNumber: '123456',
    techRecord_chassisMake: 'make',
    techRecord_chassisModel: 'model',
    techRecord_make: 'make',
    techRecord_model: 'model',
    techRecord_manufactureYear: 2025,
    techRecord_reasonForCreation: 'updated record',
    techRecord_createdByName: 'John Doe',
    techRecord_applicantDetails_emailAddress: 'john.doe@example.com',
  },
  {
    primaryVrm: 'AB12CDE',
    vin: '1HGCM82633A004352',
    techRecord_statusCode: StatusCode.ARCHIVED,
    techRecord_vehicleType: VehicleType.TRL,
    createdTimestamp: '2025-12-01T12:00:000Z',
    trailerId: 'TRL00001',
    systemNumber: '123456',
    techRecord_chassisMake: 'make',
    techRecord_chassisModel: 'model',
    techRecord_make: 'make',
    techRecord_model: 'model',
    techRecord_manufactureYear: 2025,
    techRecord_reasonForCreation: 'new record',
    techRecord_createdByName: 'John Doe',
    techRecord_applicantDetails_emailAddress: 'john.doe@example.com',
  },
] as SearchResult[];

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
    it('should return results when given a search identifier', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByCriteria.mockResolvedValueOnce(mockSearchResponse);
      const result = await handler({
        pathParameters: { searchIdentifier: '123456' },
        queryStringParameters: { searchCriteria: 'systemNumber', additionalInfo: 'true' },
      } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: JSON.stringify(mockSearchResponse), headers });
    });

    it('should return results when given the optional removed archived search criteria', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByCriteria.mockResolvedValueOnce(mockSearchResponse);
      const result = await handler({
        pathParameters: { searchIdentifier: '123456' },
        queryStringParameters: { searchCriteria: 'systemNumber', removeArchived: 'true', additionalInfo: 'true' },
      } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: JSON.stringify([mockSearchResponse[0]]), headers });
    });

    it('should return results when additional info is false', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByCriteria.mockResolvedValueOnce(mockSearchResponse);
      const result = await handler({
        pathParameters: { searchIdentifier: '123456' },
        queryStringParameters: { searchCriteria: 'systemNumber', removeArchived: 'true' },
      } as unknown as APIGatewayProxyEvent);
      const expectedResponse = mockSearchResponse.map(({ techRecord_applicantDetails_emailAddress, ...filtered }) => filtered);
      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: JSON.stringify([expectedResponse[0]]), headers });
    });

    it('should return results when not given a search criteria', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce(mockSearchResponse);
      const result = await handler({
        pathParameters: { searchIdentifier: '123456' },
        queryStringParameters: { additionalInfo: 'true' },
      } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: JSON.stringify(mockSearchResponse), headers });
    });

    it('should return results when not given a search criteria and additional info is false', async () => {
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce(mockSearchResponse);
      const result = await handler({
        pathParameters: { searchIdentifier: '123456' },
        queryStringParameters: { additionalInfo: 'false' },
      } as unknown as APIGatewayProxyEvent);
      const expectedResponse = mockSearchResponse.map(({ techRecord_applicantDetails_emailAddress, ...filtered }) => filtered);
      expect(mockSearchByAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ statusCode: 200, body: JSON.stringify(expectedResponse), headers });
    });

    it('should capitalise the searchIdentifier', async () => {
      const searchIdentifier = 'a lower case string';
      mockValidateSearchErrors.mockReturnValueOnce(null);
      mockSearchByAll.mockResolvedValueOnce(mockSearchResponse);
      const result = await handler({
        pathParameters: { searchIdentifier },
        queryStringParameters: { additionalInfo: 'true' },
      } as unknown as APIGatewayProxyEvent);
      expect(mockSearchByAll).toHaveBeenCalledTimes(1);
      expect(mockSearchByAll).toHaveBeenLastCalledWith(searchIdentifier.toUpperCase());
      expect(result).toEqual({ statusCode: 200, body: JSON.stringify(mockSearchResponse), headers });
    });
  });
});
