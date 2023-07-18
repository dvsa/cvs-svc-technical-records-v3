/* eslint-disable import/first */
const mockSend = jest.fn();
const mockQueryCommand = jest.fn();
const mockGetItemCommand = jest.fn();
const mockGenerateNewNumber = jest.fn();
const mockLambdaSend = jest.fn();
const mockTransactWriteItemsCommand = jest.fn();

const mockDynamoDBClient = jest.fn(() => ({
  send: mockSend,
}));

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => ({
    send: mockLambdaSend,
  })),
  InvokeCommand: jest.fn(),
}));

import { APIGatewayProxyEvent } from 'aws-lambda';
import { SearchCriteria } from '../../../src/models/search';
import {
  searchByCriteria,
  searchByAll,
  getBySystemNumberAndCreatedTimestamp, postTechRecord, archiveOldCreateCurrentRecord,

} from '../../../src/services/database';
import postCarData from '../../resources/techRecordCarPost.json';
import { PatchRequestRecords } from '../../../src/processors/processPatchVinRequest';

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: mockDynamoDBClient,
  QueryCommand: mockQueryCommand,
  GetItemCommand: mockGetItemCommand,
  TransactWriteItemsCommand: mockTransactWriteItemsCommand,
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

describe('getBySystemNumberAndCreatedTimestamp', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return a record when given data', async () => {
    mockSend.mockReturnValueOnce({ Item: { foo: { S: 'foo' } } });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await getBySystemNumberAndCreatedTimestamp('ABC123', '1234');
    expect(res).toStrictEqual({ foo: 'foo' });
  });

  it('should return a empty object if it cannot find a result', async () => {
    mockSend.mockReturnValueOnce({});
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const res = await getBySystemNumberAndCreatedTimestamp('ABC123', '1234');
    expect(res).toStrictEqual({});
  });

  it('should catch an error', async () => {
    mockSend.mockImplementation((): Promise<unknown> => Promise.reject(new Error('error')));
    await expect(getBySystemNumberAndCreatedTimestamp('ABC123', '1234')).rejects.toThrow();
  });
});

describe('archiveOldCreateCurrentRecord', () => {
  it('should return a success message if the transact is successful', async () => {
    const event = {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      },
      body: JSON.stringify({
        newVin: 'newVin',
      }),
    };
    const patchRecords = new PatchRequestRecords(postCarData, event as unknown as APIGatewayProxyEvent);
    mockSend.mockReturnValueOnce({});

    const res = await archiveOldCreateCurrentRecord(patchRecords.recordToArchive, patchRecords.newRecord);

    expect(res).toBe('records updated');
  });
  it('should return an error message if the transact fails', async () => {
    const event = {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      },
      body: JSON.stringify({
        newVin: 'newVin',
      }),
    };
    const patchRecords: PatchRequestRecords = new PatchRequestRecords(postCarData, event as unknown as APIGatewayProxyEvent);
    mockSend.mockImplementation((): Promise<unknown> => Promise.reject(new Error('error')));

    await expect(archiveOldCreateCurrentRecord(patchRecords.recordToArchive, patchRecords.newRecord)).rejects.toThrow();
  });
});
