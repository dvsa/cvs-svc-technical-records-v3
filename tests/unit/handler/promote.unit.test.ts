/* eslint-disable import/first */
const mockValidatePromoteErrors = jest.fn();
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockSearchByCriteria = jest.fn();
const mockUpdateVehicle = jest.fn();
const mockGetUserDetails = jest.fn();

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/promote';
import { StatusCode } from '../../../src/util/enum';

jest.mock('../../../src/validators/promote', () => ({
  validatePromoteErrors: mockValidatePromoteErrors,
}));
jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  searchByCriteria: mockSearchByCriteria,
  updateVehicle: mockUpdateVehicle,
}));
jest.mock('../../../src/services/user', () => ({
  getUserDetails: mockGetUserDetails,
}));
const headers = {
  'Access-Control-Allow-Headers':
'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Origin': '*',
};
const mockEvent = {
  pathParameters: { systemNumber: '123', createdTimestamp: '123' },
  body: '{"reasonForPromoting":"Just a test for promoting"}',
  headers: { Authorization: 'Bearer 123' },
};
const mockedDate = new Date(2023, 1, 1);

describe('Promote endpoint', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return 200 when given a provisional', async () => {
    mockValidatePromoteErrors.mockReturnValueOnce(undefined);
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: StatusCode.PROVISIONAL });
    mockSearchByCriteria.mockResolvedValueOnce([]);
    mockUpdateVehicle.mockResolvedValueOnce(undefined);
    mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent);
    const expectedBody = {
      createdTimestamp: mockedDate.toISOString(),
      techRecord_createdAt: mockedDate.toISOString(),
      techRecord_createdById: '123',
      techRecord_createdByName: 'user',
      techRecord_reasonForCreation: 'Just a test for promoting',
      techRecord_statusCode: StatusCode.CURRENT,
    };

    expect(result).toEqual({ statusCode: 200, body: JSON.stringify(expectedBody), headers });
  });

  it('should return 200 when given a provisional and there is a current', async () => {
    mockValidatePromoteErrors.mockReturnValueOnce(undefined);
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: StatusCode.PROVISIONAL })
      .mockResolvedValueOnce({ techRecord_statusCode: StatusCode.CURRENT });
    mockSearchByCriteria.mockResolvedValueOnce([{ techRecord_statusCode: StatusCode.CURRENT }]);
    mockUpdateVehicle.mockResolvedValueOnce(undefined);
    mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent);
    const expectedBody = {
      createdTimestamp: mockedDate.toISOString(),
      techRecord_createdAt: mockedDate.toISOString(),
      techRecord_createdById: '123',
      techRecord_createdByName: 'user',
      techRecord_reasonForCreation: 'Just a test for promoting',
      techRecord_statusCode: StatusCode.CURRENT,
    };

    expect(result).toEqual({ statusCode: 200, body: JSON.stringify(expectedBody), headers });
  });

  it('should return 404 when no record is found', async () => {
    mockValidatePromoteErrors.mockReturnValueOnce(undefined);
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({});

    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent);

    expect(result).toEqual({
      statusCode: 404,
      body:
      `No record found matching systemNumber ${mockEvent.pathParameters.systemNumber} and timestamp ${mockEvent.pathParameters.createdTimestamp}`,
      headers,
    });
  });

  it('should return 400 if record is not a provisional', async () => {
    mockValidatePromoteErrors.mockReturnValueOnce(undefined);
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: StatusCode.CURRENT });

    const result = await handler(mockEvent as unknown as APIGatewayProxyEvent);

    expect(result).toEqual({ statusCode: 400, body: 'Record provided is not a provisional record so cannot be promoted.', headers });
  });
});
