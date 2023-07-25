/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockArchiveOldCreateCurrentRecord = jest.fn();
const mockProcessPatchVinRequest = jest.fn();

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/patch';
import carPostRecord from '../../resources/techRecordCarPost.json';
import { TechRecordGet } from '../../../src/models/post';
import { formatTechRecord } from '../../../src/util/formatTechRecord';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp:
    mockGetBySystemNumberAndCreatedTimestamp,
  archiveOldCreateCurrentRecord: mockArchiveOldCreateCurrentRecord,
}));

jest.mock('../../../src/processors/processPatchVinRequest', () => ({
  processPatchVinRequest: mockProcessPatchVinRequest,
}));

const headers = {
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Origin': '*',
};

const recordToArchive: TechRecordGet = carPostRecord as TechRecordGet;
const recordToCreate: TechRecordGet = carPostRecord as TechRecordGet;

recordToArchive.techRecord_statusCode = 'archived';
recordToCreate.createdTimestamp = 'timenow';

describe('Test Patch Lambda Function', () => {
  describe('Error handling', () => {
    let request: APIGatewayProxyEvent;
    beforeEach(() => {
      request = {
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'accept-encoding': 'gzip, deflate, br',
          Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
          'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
        },
        pathParameters: {
          systemNumber: '123456',
          createdTimestamp: '2019-06-15T10:26:54.903Z',
        },
        body: JSON.stringify({
          newVin: 'newVin',
        }),
      } as unknown as APIGatewayProxyEvent;
      jest.resetAllMocks();
    });
    it('should return an error when given an invalid request', async () => {
      request.headers.Authorization = undefined;
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: 'Missing authorization header',
        headers,
      });
    });
    it('should return an error when VINs are invalid', async () => {
      request.body = JSON.stringify({ newVin: 'to' });
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValueOnce({
        vin: 'testVin',
      });
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: 'New VIN is invalid',
        headers,
      });
    });
    it('should return an error 400 if there is an error', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValueOnce(
        carPostRecord,
      );
      mockArchiveOldCreateCurrentRecord.mockRejectedValueOnce({
        error: 'Transact Write Items Failed',
      });
      mockProcessPatchVinRequest.mockReturnValueOnce([recordToArchive, recordToCreate]);
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 500,
        body: JSON.stringify({ error: 'Transact Write Items Failed' }),
        headers,
      });
    });
  });
  describe('Success', () => {
    let request: APIGatewayProxyEvent;
    beforeEach(() => {
      request = {
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'accept-encoding': 'gzip, deflate, br',
          Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
          'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
        },
        pathParameters: {
          systemNumber: '123456',
          createdTimestamp: '2019-06-15T10:26:54.903Z',
        },
        body: JSON.stringify({
          newVin: 'newVin',
        }),
      } as unknown as APIGatewayProxyEvent;
      jest.resetAllMocks();
    });
    it('gets the systemNumber and createdTimestamp from the URL', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValue(carPostRecord);
      mockArchiveOldCreateCurrentRecord.mockReturnValue({
        message: 'records updated',
      });
      mockProcessPatchVinRequest.mockReturnValueOnce([recordToArchive, recordToCreate]);

      const result = await handler(request as unknown as APIGatewayProxyEvent);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledWith(request.pathParameters!.systemNumber, request.pathParameters!.createdTimestamp);
    });
    it('should return 200 and success message', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValue(carPostRecord);
      mockArchiveOldCreateCurrentRecord.mockReturnValue({
        message: 'records updated',
      });
      mockProcessPatchVinRequest.mockReturnValueOnce([recordToArchive, recordToCreate]);
      const result = await handler(request as unknown as APIGatewayProxyEvent);

      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify(formatTechRecord(recordToCreate)),
        headers,
      });
    });
  });
});