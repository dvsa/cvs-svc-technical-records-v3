/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockProcessCorrectVrm = jest.fn();
const mockProcessCherishedTransfer = jest.fn()

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/updateVrm';
import * as UserDetails from '../../../src/services/user';
import { ERRORS } from '../../../src/util/enum';
import carData from '../../resources/techRecordCarPost.json';
import { mockToken } from '../util/mockToken';
import { addHttpHeaders } from '../../../src/util/httpHeaders';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
}));

jest.mock('../../../src/processors/processCorrectVrm', () => ({
  processCorrectVrm: mockProcessCorrectVrm
}));

jest.mock('../../../src/processors/processCherishedTransfer', () => ({
  processCherishedTransfer: mockProcessCherishedTransfer
}))

const mockUserDetails = {
  username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
};

describe('update vrm handler', () => {
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
        newVrm: 'foo',
        isCherishedTransfer: true,
      }),
    } as unknown as APIGatewayProxyEvent;
    jest.resetAllMocks();
    jest.resetModules();
  });

  describe('Successful cherished transfer response', () => {
    it('should pass validation and return a 200 response', async () => {
      const newBody = JSON.stringify({
        newVrm: 'SJG1020',
        isCherishedTransfer: true,
        newDonorVrm: '01234'
      });
      request.body = newBody;
      process.env.AWS_SAM_LOCAL = 'true';
      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValue(carData);
      mockProcessCherishedTransfer.mockResolvedValue(addHttpHeaders({statusCode: 200, body: JSON.stringify('hiya')}))
      const result = await handler(request);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockProcessCherishedTransfer).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
  });

  describe('Successful correct error response', () => {
    it('should pass validation and return a 200 response', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      const newBody = JSON.stringify({
        newVrm: 'foo',
        isCherishedTransfer: false,
      });
      request.body = newBody;

      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(carData);
      mockProcessCorrectVrm.mockReturnValueOnce(addHttpHeaders({statusCode: 200, body: JSON.stringify('hiya')}));

      const result = await handler(request);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockProcessCorrectVrm).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
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
      expect(result.body).toBe('invalid request');
    });
    it('should return error when event is invalid', async () => {
      const result = await handler({ body: null } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('Missing system number');
    });
    it('should return an error when request has no auth header', async () => {
      request.headers.Authorization = undefined;
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(ERRORS.MISSING_AUTH_HEADER);
    });
    it('should return an error when VINs are invalid', async () => {
      request.body = JSON.stringify({ newVrm: null });
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValueOnce({
        vin: 'testVin',
      });
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('You must provide a new VRM');
    });
    it('should return the current record when there is a duplicate vrm', async () => {
      request.body = JSON.stringify({ newVrm: 'SJG1020' });
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValueOnce({
        techRecord_manufactureYear: 'null',
        primaryVrm: 'SJG1020',
        techRecord_make: 'null',
        vin: 'DP76UMK4DQLTOT400021',
        techRecord_statusCode: 'current',
        systemNumber: 'XYZEP5JYOMM00020',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2019-06-24T10:26:54.903Z',
        techRecord_model: 'null',
      });
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
    it('should return an error when the vrm contains special characters', async () => {
      request.body = JSON.stringify({ newVrm: 'S!@£JG1020' });
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValueOnce({
        techRecord_manufactureYear: 'null',
        primaryVrm: 'SJG1020',
        techRecord_make: 'null',
        vin: 'DP76UMK4DQLTOT400021',
        techRecord_statusCode: 'current',
        systemNumber: 'XYZEP5JYOMM00020',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2019-06-24T10:26:54.903Z',
        techRecord_model: 'null',
      });
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('Invalid VRM');
    });
    it('should return 500 internal server error if the transact fails', () => {

    })
  });


});
