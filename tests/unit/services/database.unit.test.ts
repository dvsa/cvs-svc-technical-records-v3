/* eslint-disable import/first */
const mockSend = jest.fn();
const mockQueryCommand = jest.fn();
const mockGetItemCommand = jest.fn();
const mockLambdaSend = jest.fn();
const mockTransactWriteItemsCommand = jest.fn();
const mockPutItemCommand = jest.fn();

const mockDynamoDBClient = jest.fn(() => ({
  send: mockSend,
}));

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => ({
    send: mockLambdaSend,
  })),
  InvokeCommand: jest.fn(),
}));
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: mockDynamoDBClient,
  QueryCommand: mockQueryCommand,
  GetItemCommand: mockGetItemCommand,
  TransactWriteItemsCommand: mockTransactWriteItemsCommand,
  PutItemCommand: mockPutItemCommand,
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockImplementation(() => ({ send: mockSend })),
  },
}));

import { PutItemCommand, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { TechRecordType as TechRecordTypeVerbVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';
import { tableName } from '../../../src/config';
import { SearchCriteria } from '../../../src/models/search';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../../../src/services/audit';
import {
  correctVrm,
  getBySystemNumberAndCreatedTimestamp,
  searchByAll,
  searchByCriteria,
  updateVehicle,
} from '../../../src/services/database';
import * as UserDetails from '../../../src/services/user';
import { StatusCode } from '../../../src/util/enum';
import postCarData from '../../resources/techRecordCarPost.json';
import { mockToken } from '../util/mockToken';

const mockUserDetails = {
  username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
};
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

describe('updateVehicle', () => {
  it('should return a success message if the transaction is successful', async () => {
    const event = {
      headers: {
        Authorization: mockToken,
      },
      body: JSON.stringify({
        techRecord_reasonForCreation: 'TEST update',
      }),
    };
    jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
    const recordFromDB = postCarData as TechRecordType<'get'>;
    const newRecord = { ...(postCarData as TechRecordType<'get'>), ...JSON.parse(event.body) } as TechRecordType<'get'>;
    const date = new Date().toISOString();
    const updatedRecordFromDB = setLastUpdatedAuditDetails(recordFromDB, mockUserDetails.username, mockUserDetails.msOid, date, StatusCode.ARCHIVED);
    const updatedNewRecord = setCreatedAuditDetails(
      newRecord,
      mockUserDetails.username,
      mockUserDetails.msOid,
      date,
      newRecord.techRecord_statusCode as StatusCode,
    );
    mockSend.mockImplementation(() => Promise.resolve({}));

    const res = await updateVehicle([updatedRecordFromDB], [updatedNewRecord]);

    expect((res as TechRecordType<'get'>[])[0].techRecord_reasonForCreation).toBe('TEST update');
  });
  it('should return a success message if the transaction only has a new record given', async () => {
    const event = {
      headers: {
        Authorization: mockToken,
      },
      body: JSON.stringify({
        techRecord_reasonForCreation: 'TEST update',
      }),
    };
    jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
    const newRecord = { ...(postCarData as TechRecordType<'get'>), ...JSON.parse(event.body) } as TechRecordType<'get'>;
    const date = new Date().toISOString();
    const updatedNewRecord = setCreatedAuditDetails(
      newRecord,
      mockUserDetails.username,
      mockUserDetails.msOid,
      date,
      newRecord.techRecord_statusCode as StatusCode,
    );
    mockSend.mockImplementation(() => Promise.resolve({}));

    const res = await updateVehicle([], [updatedNewRecord]);

    const mockSendParam = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: tableName,
            Item: marshall(updatedNewRecord, { removeUndefinedValues: true }),
          },
        },
      ],
    });

    expect(mockSend).toHaveBeenCalledWith(mockSendParam);
    expect((res as TechRecordType<'get'>[])[0].techRecord_reasonForCreation).toBe('TEST update');
  });
  it('should return an error message if the transaction fails', async () => {
    const event = {
      headers: {
        Authorization: mockToken,
      },
      body: JSON.stringify({
        techRecord_reasonForCreation: 'TEST update',
      }),
    };
    jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
    const recordFromDB = postCarData as TechRecordType<'get'>;
    const newRecord = { ...(postCarData as TechRecordType<'get'>), ...JSON.parse(event.body) } as TechRecordType<'get'>;
    const date = new Date().toISOString();
    const updatedRecordFromDB = setLastUpdatedAuditDetails(recordFromDB, mockUserDetails.username, mockUserDetails.msOid, date, StatusCode.ARCHIVED);
    const updatedNewRecord = setCreatedAuditDetails(
      newRecord,
      mockUserDetails.username,
      mockUserDetails.msOid,
      date,
      newRecord.techRecord_statusCode as StatusCode,
    );
    mockSend.mockImplementation((): Promise<unknown> => Promise.reject(new Error('error')));

    await expect(updateVehicle([updatedRecordFromDB], [updatedNewRecord])).rejects.toBe('error');
  });

  describe('correctVrm', () => {
    it('should return a success message if the transaction is successful', async () => {
      const newRecord = { ...postCarData };
      newRecord.primaryVrm = 'FOO';
      const mockPutCommand = new PutItemCommand({
        TableName: tableName,
        Item: marshall(newRecord),
      });

      mockSend.mockImplementation(() => Promise.resolve({ ...newRecord }));

      const send = await correctVrm(newRecord as TechRecordType<'get'>);
      expect(mockSend).toHaveBeenCalledWith(mockPutCommand);
      expect((send as TechRecordTypeVerbVehicle<'psv', 'get'>).primaryVrm).toBe('FOO');
    });
  });
  it('should reject with an error if the put fails', async () => {
    const newRecord = { ...postCarData };
    newRecord.primaryVrm = 'FOO';

    mockSend.mockImplementation((): Promise<unknown> => Promise.reject(new Error('error')));

    const send = correctVrm(newRecord as TechRecordType<'get'>);

    await expect(send).rejects.toBe('error');
  });
});
