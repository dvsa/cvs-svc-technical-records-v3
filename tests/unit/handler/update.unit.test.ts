/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockUpdateVehicle = jest.fn();
const mockProcessUpdateRequest = jest.fn();

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/update';
import * as UserDetails from '../../../src/services/user';
import { ERRORS } from '../../../src/util/enum';
import hgvData from '../../resources/techRecordHGVPost.json';
import { mockToken } from '../util/mockToken';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  updateVehicle: mockUpdateVehicle,
}));

jest.mock('../../../src/processors/processUpdateRequest', () => ({
  processUpdateRequest: mockProcessUpdateRequest,
}));
const mockUserDetails = {
  username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
};

describe('update handler', () => {
  let request: APIGatewayProxyEvent;
  beforeEach(() => {
    request = {
      headers: {
        Authorization: mockToken,
      },
      pathParameters: {
        systemNumber: '10000067',
        createdTimestamp: '2023-06-16T11:26:30.196Z',
      },
      body: JSON.stringify({
        techRecord_reasonForCreation: 'Test Update',
        techRecord_approvalType: 'NTA',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleClass_code: 't',
        techRecord_vehicleClass_description: 'trailer',
        techRecord_vehicleConfiguration: 'rigid',
        techRecord_vehicleType: 'trl',
        trailerId: 'C530005',
        vin: '9080977997',
      }),
    } as unknown as APIGatewayProxyEvent;
    jest.resetAllMocks();
    jest.resetModules();
  });

  describe('Successful Response', () => {
    it('should pass validation and return a 200 response', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData);
      const newRecord = { ...hgvData, ...JSON.parse(request.body ?? '') } as TechRecordType<'put'>;
      mockProcessUpdateRequest.mockReturnValueOnce([hgvData, newRecord]);
      mockUpdateVehicle.mockResolvedValueOnce(newRecord);
      const result = await handler(request);

      expect(result.statusCode).toBe(200);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockProcessUpdateRequest).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
      expect(result.body).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return error when event has no body', async () => {
      const invalidRequest = {
        headers: {
          Authorization: mockToken,
        },
        pathParameters: {
          systemNumber: '10000067',
          createdTimestamp: '2023-06-16T11:26:30.196Z',
        },
      } as unknown as APIGatewayProxyEvent;
      const result = await handler(invalidRequest);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(ERRORS.MISSING_PAYLOAD);
    });
    it('should return error when event is invalid', async () => {
      const result = await handler({ body: null } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('Failed to update record');
    });
    it('should return an error when request has no auth header', async () => {
      request.headers.Authorization = undefined;
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(JSON.stringify({ error: ERRORS.MISSING_AUTH_HEADER }));
    });
    it('should return an error when VINs are invalid', async () => {
      request.body = JSON.stringify({
        techRecord_reasonForCreation: 'Test Update',
        techRecord_approvalType: 'NTA',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleClass_code: 't',
        techRecord_vehicleClass_description: 'trailer',
        techRecord_vehicleConfiguration: 'rigid',
        techRecord_vehicleType: 'trl',
        trailerId: 'C530005',
        vin: 'to',
      });
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValueOnce({
        vin: 'testVin',
      });
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(ERRORS.VIN_ERROR);
    });
    it('should throw error if transaction fails', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData);
      const newRecord = { ...hgvData, ...JSON.parse(request.body!) } as TechRecordType<'put'>;
      mockProcessUpdateRequest.mockReturnValueOnce([hgvData, newRecord]);
      mockUpdateVehicle.mockRejectedValueOnce('Error');
      const result = await handler(request);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockProcessUpdateRequest).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('Failed to update record');
    });
  });
});
