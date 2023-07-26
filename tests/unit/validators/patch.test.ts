/* eslint-disable import/first */
const mockSearchByCriteria = jest.fn();
const mockValidateSysNumTimestampPathParams = jest.fn();

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { TechrecordGet } from '../../../src/models/post';
import { formatTechRecord } from '../../../src/util/formatTechRecord';
import {
    validateUpdateVinRequest,
    validateVins,
} from '../../../src/validators/patch';
import carPostRecord from '../../resources/techRecordCarPost.json';

const headers = {
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Origin': '*',
};

jest.mock('../../../src/services/database.ts', () => ({
  searchByCriteria: mockSearchByCriteria,
}));

jest.mock('../../../src/validators/sysNumTimestamp.ts', () => ({
  validateSysNumTimestampPathParams: mockValidateSysNumTimestampPathParams,
}));

const currentRecord = carPostRecord as TechrecordGet;

describe('Test updateVin Validators', () => {
  describe('validateUpdateVinRequest', () => {
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
    });
    it('should return an error when missing a systemNumber from path', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce({ statusCode: 400, body: 'Missing system number', headers });
      const result = validateUpdateVinRequest(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: 'Missing system number',
        headers,
      });
    });
    it('should return an error when missing a createdTimestamp from path', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce({ statusCode: 400, body: 'Missing created timestamp', headers });
      const result = validateUpdateVinRequest(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: 'Missing created timestamp',
        headers,
      });
    });
    it('should return an error when missing a request body', () => {
      request.body = null;
      const result = validateUpdateVinRequest(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: 'invalid request',
        headers,
      });
    });
    it('should return an error when missing the new VIN', () => {
      request.body = JSON.stringify({ newVin: '' });
      const result = validateUpdateVinRequest(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: 'You must provide a new VIN',
        headers,
      });
    });
    it('should return an error when missing the msUserDetails', () => {
      delete request.headers.Authorization;
      const result = validateUpdateVinRequest(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: 'Missing authorization header',
        headers,
      });
    });
  });

  describe('validateVins', () => {
    it('should return an error if new VIN is shorter than 3 characters', () => {
      const result = validateVins(currentRecord, 'TO');
      expect(result).toEqual({
        statusCode: 400,
        body: 'New VIN is invalid',
        headers,
      });
    });
    it('should return an error if new VIN is longer than 21 characters', () => {
      const result = validateVins(currentRecord, 'TOTOTOTOTOTOTOTOTOTOTO');
      expect(result).toEqual({
        statusCode: 400,
        body: 'New VIN is invalid',
        headers,
      });
    });
    it('should return an error if new VIN is the same as the old VIN', () => {
      const result = validateVins(currentRecord, 'AA11100851');
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify(formatTechRecord(currentRecord)),
        headers,
      });
    });
  });
});
