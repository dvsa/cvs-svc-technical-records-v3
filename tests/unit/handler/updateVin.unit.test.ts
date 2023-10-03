/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockUpdateVehicle = jest.fn();

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/updateVin';
import * as UserDetails from '../../../src/services/user';
import { ERRORS } from '../../../src/util/enum';
import hgvData from '../../resources/techRecordHGVPost.json';
import { mockToken } from '../util/mockToken';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  updateVehicle: mockUpdateVehicle,
}));

const payload = {
  newVin: '987654321',
};

const mockUserDetails = {
  username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
};

describe('update vin handler', () => {
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
      body: JSON.stringify(payload),
    } as unknown as APIGatewayProxyEvent;
    jest.resetAllMocks();
    jest.resetModules();
  });
  describe('successful change', () => {
    it('should pass validation, return a 200', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData);
      const newRecord = { ...hgvData, ...JSON.parse(request.body ?? '') } as TechRecordType<'put'>;
      mockUpdateVehicle.mockResolvedValueOnce(newRecord);
      const result = await handler(request);

      expect(result.statusCode).toBe(200);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
      expect(result.body).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should error when no body is given', async () => {
      request.body = null;
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('{"errors":["Missing payload!"]}');
    });

    it('should error if no new vin is given', async () => {
      request.body = JSON.stringify({ newVin: null });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('{"errors":["No new VIN provided"]}');
    });

    it('should error if the record is archived', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'archived' });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD);
    });

    it('should error if the new vin is invalid', async () => {
      request.body = JSON.stringify({ newVin: 'OIQ1' });
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'current' });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(ERRORS.VIN_ERROR);
    });
  });
});
