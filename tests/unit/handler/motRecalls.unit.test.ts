/* eslint-disable import/first */
const mockFilterMotRecalls = jest.fn();
const mockGetMotRecallsByVin = jest.fn();
const mockGetBearerToken = jest.fn();
const mockValidateSingleVin = jest.fn();
const mockValidateFeatureFlags = jest.fn();

import { SecretsManager } from '@dvsa/aws-utilities/classes/secrets-manager-client';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { APIGatewayProxyEvent } from 'aws-lambda/trigger/api-gateway-proxy';
import { handler } from '../../../src/handler/motRecalls';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { addHttpHeaders } from '../../../src/util/httpHeaders';
import logger from '../../../src/util/logger';

jest.mock('../../../src/util/motRecalls.ts', () => ({
  filterMotRecalls: mockFilterMotRecalls,
  getMotRecallsByVin: mockGetMotRecallsByVin,
  getBearerToken: mockGetBearerToken,
}));

jest.mock('../../../src/validators/motRecalls.ts', () => ({
  validateSingleVin: mockValidateSingleVin,
  validateFeatureFlags: mockValidateFeatureFlags,
}));

jest.mock('../../../src/util/logger');

jest.mock('@dvsa/aws-utilities/classes/secrets-manager-client');

describe('Test Recalls Endpoint', () => {
  process.env.MOT_RECALL_SECRET = 'secret';
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    mockValidateFeatureFlags.mockResolvedValue(undefined);
  });

  const mockDefaultResponse: APIGatewayProxyResult = addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify({
      manufacturer: null,
      hasRecall: false,
    }),
  });

  describe('WHEN the feature flag validation fails', () => {
    it('SHOULD return a 500 response', async () => {
      mockValidateFeatureFlags.mockResolvedValueOnce(addHttpHeaders({
        statusCode: 500,
        body: 'Recall Feature Flag is undefined',
      }));

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toBe(500);
      expect(res.body).toBe('Recall Feature Flag is undefined');
    });
  });

  describe('WHEN the VIN validation fails', () => {
    it('SHOULD log VIN ERROR and return a 200 response with no recalls', async () => {
      mockValidateSingleVin.mockReturnValue(false);

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toEqual(mockDefaultResponse.statusCode);
      expect(res.body).toEqual(mockDefaultResponse.body);
      expect(logger.error).toHaveBeenCalledWith(formatErrorMessage('VIN provided in path parameter is not valid.'));
    });
  });
  describe('WHEN it cannot retrieve the bearer token from the MOT API', () => {
    it('SHOULD log error and return a 200 response with no recalls', async () => {
      (SecretsManager.get as jest.Mock).mockResolvedValue({});
      mockValidateSingleVin.mockReturnValue(true);
      mockGetBearerToken.mockReturnValue(undefined);

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toEqual(mockDefaultResponse.statusCode);
      expect(res.body).toEqual(mockDefaultResponse.body);
      expect(logger.error).toHaveBeenCalledWith('bearer token not found');
    });
  });
  describe('WHEN it cannot retrieve the recall data from the MOT API', () => {
    it('SHOULD return a 200 response with no recalls', async () => {
      mockValidateSingleVin.mockReturnValue(true);
      mockGetBearerToken.mockReturnValue('test');
      mockGetMotRecallsByVin.mockReturnValue(undefined);

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toEqual(mockDefaultResponse.statusCode);
      expect(res.body).toEqual(mockDefaultResponse.body);
    });
  });
  describe('WHEN an error is thrown in the code body', () => {
    it('should log out the error and return a 500 response', async () => {
      mockValidateSingleVin.mockReturnValue(true);
      mockGetBearerToken.mockReturnValue('test');
      mockGetMotRecallsByVin.mockImplementationOnce(() => { throw new Error('error is bad'); });

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toBe(500);
      expect(res.body).toBe('Error calling recalls API');
    });
  });
  describe('happy path', () => {
    it('SHOULD return a 200 response with a valid recall response', async () => {
      const motRecallResponse = {
        vin: '1234',
        manufacturer: 'Manufacturer',
        recalls: [
          {
            manufacturerCampaignReference: 'ref1',
            dvsaCampaignReference: 'ref123',
            recallCampaignStartDate: '12345',
            repairStatus: 'NOT_FIXED',
          },
        ],
        lastUpdatedDate: '1234',
      };

      mockValidateSingleVin.mockReturnValue(true);
      mockGetBearerToken.mockReturnValue('test');
      mockGetMotRecallsByVin.mockReturnValue(motRecallResponse);
      mockFilterMotRecalls.mockReturnValue({ manufacturer: 'Manufacturer', hasRecall: true });

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toEqual(mockDefaultResponse.statusCode);
      expect(res.body).toEqual(JSON.stringify({
        manufacturer: 'Manufacturer',
        hasRecall: true,
      }));
    });
  });
});
