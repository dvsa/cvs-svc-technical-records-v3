/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockUpdateVehicle = jest.fn();
const mockProcessUpdateRequest = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/update';
import hgvData from '../../resources/techRecordHGVPost.json';
import * as UserDetails from '../../../src/services/user';
import { TechrecordPut } from '../../../src/models/post';
import { ERRORS } from '../../../src/util/enum';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  updateVehicle: mockUpdateVehicle,
}));

jest.mock('../../../src/processors/processUpdateRequest', () => ({
  processUpdateRequest: mockProcessUpdateRequest,
}));
const userDetails = {
  username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
};

describe('update handler', () => {
  let request: APIGatewayProxyEvent;
  beforeEach(() => {
    request = {
      headers: {
        Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      },
      pathParameters: {
        systemNumber: '10000067',
        createdTimestamp: '2023-06-16T11:26:30.196Z',
      },
      body: JSON.stringify({
        techRecord_reasonForCreation: 'Test Update',
        techRecord_approvalType: 'Test',
      }),
    } as unknown as APIGatewayProxyEvent;
    jest.resetAllMocks();
    jest.resetModules();
  });

  describe('Successful Response', () => {
    it('should pass validation and return a 200 response', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(userDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData);
      const newRecord = { ...hgvData, ...JSON.parse(request.body!) } as TechrecordPut;
      mockProcessUpdateRequest.mockResolvedValueOnce([hgvData, newRecord]);
      mockUpdateVehicle.mockResolvedValueOnce(newRecord);
      const result = await handler(request);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockProcessUpdateRequest).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return error when event has no body', async () => {
      const invalidRequest = {
        headers: {
          Authorization:
              'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
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
    it('should return error when event has no Authorisation header', async () => {
      const result = await handler({ body: null } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('Failed to update record');
    });
    it('should throw error if transaction fails', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      jest.spyOn(UserDetails, 'getUserDetails').mockReturnValueOnce(userDetails);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData);
      const newRecord = { ...hgvData, ...JSON.parse(request.body!) } as TechrecordPut;
      mockProcessUpdateRequest.mockResolvedValueOnce([hgvData, newRecord]);
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
