/* eslint-disable import/first */
const mockSend = jest.fn();

const mockQueryCommand = jest.fn();

const mockDynamoDBClient = jest.fn(() => ({
  send: mockSend,
}));

import { SearchCriteria } from '../../../src/models/search';
import { searchByCriteria, searchByAll } from '../../../src/services/database';

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: mockDynamoDBClient,
  QueryCommand: mockQueryCommand,
}));

describe('searchByCriteria', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const testCases = [
    {
      criteria: SearchCriteria.PRIMARYVRM,
    },
    {
      criteria: SearchCriteria.VIN,
    },
    {
      criteria: SearchCriteria.SYSTEM_NUMBER,
    },
    {
      criteria: SearchCriteria.TRAILERID,
    },
    {
      criteria: SearchCriteria.PARTIALVIN,
    },
  ];
  it.each(testCases)('should query by $criteria', async ({ criteria }) => {
    mockSend.mockReturnValueOnce({ data: { Items: [{ foo: 'foo' }] } });
    await searchByCriteria(criteria as Exclude<SearchCriteria, SearchCriteria.ALL>, 'ABC 123');
    expect(mockQueryCommand).toHaveBeenCalledWith(expect.objectContaining(
      { ExpressionAttributeNames: { [`#${criteria}`]: criteria } },
    ));
  });

  it('should catch the error and throw a new one', async () => {
    mockSend.mockRejectedValueOnce(new Error('oops'));
    await expect(searchByCriteria(SearchCriteria.PRIMARYVRM, 'ABC123')).rejects.toThrow();
  });
});

describe('searchByAll', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should let me do a search by all', async () => {
    mockSend.mockImplementation((): Promise<unknown> => Promise.resolve([]));
    await searchByAll('12345');
    expect(mockQueryCommand).toHaveBeenCalledWith(expect.objectContaining(
      { ExpressionAttributeNames: { '#systemNumber': 'systemNumber' } },
    ));
    expect(mockQueryCommand).toHaveBeenCalledWith(expect.objectContaining(
      { ExpressionAttributeNames: { '#partialVin': 'partialVin' } },
    ));
    expect(mockQueryCommand).toHaveBeenCalledWith(expect.objectContaining(
      { ExpressionAttributeNames: { '#primaryVrm': 'primaryVrm' } },
    ));
    expect(mockQueryCommand).toHaveBeenCalledWith(expect.objectContaining(
      { ExpressionAttributeNames: { '#vin': 'vin' } },
    ));
    expect(mockQueryCommand).toHaveBeenCalledWith(expect.objectContaining(
      { ExpressionAttributeNames: { '#trailerId': 'trailerId' } },
    ));
  });

  it('should catch an error', async () => {
    mockSend.mockImplementation((): Promise<unknown> => Promise.reject(new Error('error')));
    await expect(searchByAll('ABC123')).rejects.toThrow();
  });
});
