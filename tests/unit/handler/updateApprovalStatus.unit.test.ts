/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockUpdateVehicle = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/updateADR';
import * as UserDetails from '../../../src/services/user';
import { ERRORS } from '../../../src/util/enum';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import hgvData from '../../resources/techRecordHGVPost.json';
import { mockToken } from '../util/mockToken';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  updateVehicle: mockUpdateVehicle,
}));

const payload = {
  adrApproved: true,
  receivedDate: '2024-01-01',
};

const mockUserDetails = {
  username: 'Test User', msOid: '123456', email: 'testUser@test.com',
};

describe('update approval status handler', () => {
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
    it('should pass validation, return a 204', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      const recordWithAdr = { ...hgvData, techRecord_statusCode: 'current', techRecord_adrDetails_dangerousGoods: true };
      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(recordWithAdr);
      mockUpdateVehicle.mockResolvedValueOnce(recordWithAdr);
      const result = await handler(request);

      expect(result.statusCode).toBe(204);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
      expect(result.body).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should error when no system number is given', async () => {
      request.pathParameters = { createdTimestamp: '2023-06-16T11:26:30.196Z' };
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(JSON.stringify({ errors: ['Missing system number'] }));
    });

    it('should error when no created timestamp is given', async () => {
      request.pathParameters = { systemNumber: '10000067' };
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(JSON.stringify({ errors: ['Missing created timestamp'] }));
    });

    it('should error when no body is given', async () => {
      request.body = null;
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage(ERRORS.MISSING_PAYLOAD));
    });

    it('should error when body is empty object', async () => {
      request.body = JSON.stringify({});
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage(ERRORS.MISSING_PAYLOAD));
    });

    it('should error if adrApproved is not a boolean', async () => {
      request.body = JSON.stringify({ adrApproved: 'yes', receivedDate: '2024-01-01' });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage('adrApproved must be a boolean'));
    });

    it('should error if receivedDate is not provided', async () => {
      request.body = JSON.stringify({ adrApproved: true });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage('Invalid receivedDate provided'));
    });

    it('should error if receivedDate has invalid format', async () => {
      request.body = JSON.stringify({ adrApproved: true, receivedDate: '01-01-2024' });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage('Invalid receivedDate provided'));
    });

    it('should error if receivedDate is in the future', async () => {
      request.body = JSON.stringify({ adrApproved: true, receivedDate: '2099-01-01' });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage('receivedDate cannot be in the future'));
    });

    it('should return 404 if record is not found', async () => {
      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(undefined);
      const result = await handler(request);
      expect(result.statusCode).toBe(404);
      expect(result.body).toBe(JSON.stringify({ message: 'Record not found.' }));
    });

    it('should error if the record is archived', async () => {
      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'archived' });
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(formatErrorMessage(ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD));
    });

    it('should return 404 if record has dangerousGoods set to false', async () => {
      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({
        techRecord_statusCode: 'current',
        techRecord_adrDetails_dangerousGoods: false,
      });
      const result = await handler(request);
      expect(result.statusCode).toBe(404);
      expect(result.body).toBe(JSON.stringify({ message: 'Record does not have ADR details' }));
    });

    it('should return 500 if an unexpected error occurs', async () => {
      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockRejectedValueOnce(new Error('DB error'));
      const result = await handler(request);
      expect(result.statusCode).toBe(500);
      expect(result.body).toEqual(formatErrorMessage(ERRORS.FAILED_UPDATE_MESSAGE));
    });

    // it('should return 500 if getUserDetails throws', async () => {
    //   jest.spyOn(UserDetails, 'getUserDetails').mockImplementationOnce(() => { throw new Error('Bad token'); });
    //   const result = await handler(request);
    //   expect(result.statusCode).toBe(500);
    //   expect(result.body).toEqual(formatErrorMessage(ERRORS.FAILED_UPDATE_MESSAGE));
    // });
    //
    // it('should handle missing Authorization header gracefully', async () => {
    //   request.headers = {};
    //   jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
    //   mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({
    //     techRecord_statusCode: 'current',
    //     techRecord_adrDetails_dangerousGoods: true,
    //   });
    //   mockUpdateVehicle.mockResolvedValueOnce(undefined);
    //   const result = await handler(request);
    //   expect(result.statusCode).toBe(204);
    // });
  });
});
