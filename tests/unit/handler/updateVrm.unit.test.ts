/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockCorrectVrm = jest.fn();
const mockUpdateVehicle = jest.fn();
const mockSearchByCriteria = jest.fn();
const mockDonorVehicle = jest.fn();
const mockValidateVrmExists = jest.fn();
const mockValidateUpdateVrmRequest = jest.fn();
const mockValidateVrm = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/updateVrm';
import * as UserDetails from '../../../src/services/user';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { addHttpHeaders } from '../../../src/util/httpHeaders';
import carData from '../../resources/techRecordCarPost.json';
import { mockToken } from '../util/mockToken';
import { ERRORS } from '../../../src/util/enum';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  updateVehicle: mockUpdateVehicle,
  searchByCriteria: mockSearchByCriteria,
  correctVrm: mockCorrectVrm,
}));

jest.mock('../../../src/services/donorVehicle', () => ({
  donorVehicle: mockDonorVehicle,
}));

jest.mock('../../../src/validators/update', () => ({
  validateVrmExists: mockValidateVrmExists,
  validateUpdateVrmRequest: mockValidateUpdateVrmRequest,
  validateVrm: mockValidateVrm,
}));

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
        newVrm: 'DONORVRM',
        isCherishedTransfer: true,
        thirdMark: '01234',
      });
      request.body = newBody;
      process.env.AWS_SAM_LOCAL = 'true';
      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(mockUserDetails);
      mockValidateUpdateVrmRequest.mockReturnValueOnce(false);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValue(carData);
      mockValidateVrmExists.mockReturnValueOnce(false);
      mockDonorVehicle.mockReturnValue([{ ...carData, primaryVrm: 'DONORVRM' }, undefined]);
      mockUpdateVehicle.mockResolvedValueOnce({});
      const result = await handler(request);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
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
      mockValidateUpdateVrmRequest.mockReturnValueOnce(false);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(carData);
      mockValidateVrm.mockReturnValueOnce(false);
      mockValidateVrmExists.mockReturnValueOnce(false);
      mockCorrectVrm.mockResolvedValueOnce({});

      const result = await handler(request);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest.resetModules();
    });
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
      mockValidateUpdateVrmRequest.mockReturnValueOnce(addHttpHeaders({ statusCode: 400, body: 'invalid request' }));
      const result = await handler(invalidRequest);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('invalid request');
    });
    it('should return error when event is invalid', async () => {
      request.pathParameters = null;
      mockValidateUpdateVrmRequest.mockReturnValueOnce(addHttpHeaders(
        {
          statusCode: 400,
          body: JSON.stringify({ errors: ['Missing system number'] }),
        },
      ));
      const result = await handler(request);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(formatErrorMessage('Missing system number'));
    });
    it('should return an error when request has no auth header', async () => {
      request.headers.Authorization = undefined;
      mockValidateUpdateVrmRequest.mockReturnValueOnce(addHttpHeaders(
        {
          statusCode: 400,
          body: formatErrorMessage(ERRORS.MISSING_AUTH_HEADER),
        },
      ));
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(formatErrorMessage(ERRORS.MISSING_AUTH_HEADER));
    });
    it('should return an error when VINs are invalid', async () => {
      request.body = JSON.stringify({ newVrm: null });
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValueOnce({
        vin: 'testVin',
      });
      mockValidateVrm.mockReturnValueOnce(addHttpHeaders({ statusCode: 400, body: formatErrorMessage('You must provide a new VRM') }));
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage('You must provide a new VRM'));
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
      mockValidateVrmExists.mockReturnValueOnce(addHttpHeaders({ statusCode: 400, body: 'Primary VRM SJG1020 already exists' }));
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('Primary VRM SJG1020 already exists');
    });
    it('should return an error when there is an error with the donor record', async () => {
      request.body = JSON.stringify({ newVrm: 'SJG1020', isCherishedTransfer: true, thirdMark: 'testing' });
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
      mockValidateVrmExists.mockReturnValueOnce(false);
      mockDonorVehicle.mockReturnValueOnce([{}, addHttpHeaders({ statusCode: 400, body: 'error' })]);
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe('error');
    });
    it('returns 500 if there is an error', async () => {
      request.body = JSON.stringify({ newVrm: 'SJG1020', isCherishedTransfer: true, thirdMark: 'testing' });
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
      expect(result.statusCode).toBe(500);
      expect(result.body).toBe(formatErrorMessage(
        'Failed to update record: TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))',
      ));
    });
    it('should return 400 if the vrm exists on a non archived record', async () => {
      request.body = JSON.stringify({ newVrm: 'SJG1020' });
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValue(carData);
      mockValidateVrmExists.mockResolvedValueOnce(addHttpHeaders(
        {
          statusCode: 400,
          body: formatErrorMessage('Primary VRM SJG1020 already exists'),
        },
      ));
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toBe(formatErrorMessage('Primary VRM SJG1020 already exists'));
    });
  });
});
