/* eslint-disable import/first */
const mockGetProfile = jest.fn();
const mockFilterMotRecalls = jest.fn();
const mockGetMotRecallsByVin = jest.fn();
const mockGetBearerToken = jest.fn();
const mockValidateSingleVin = jest.fn();

import type { APIGatewayProxyResult } from 'aws-lambda';
import { APIGatewayProxyEvent } from 'aws-lambda/trigger/api-gateway-proxy';
import { handler } from '../../../src/handler/recalls';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { addHttpHeaders } from '../../../src/util/httpHeaders';
import logger from '../../../src/util/logger';

jest.mock('@dvsa/cvs-feature-flags/profiles/vtx', () => ({
  getProfile: mockGetProfile,
}));

jest.mock('../../../src/util/recalls.ts', () => ({
  filterMotRecalls: mockFilterMotRecalls,
  getMotRecallsByVin: mockGetMotRecallsByVin,
  getBearerToken: mockGetBearerToken,
}));

jest.mock('../../../src/validators/recalls.ts', () => ({
  validateSingleVin: mockValidateSingleVin,
}));

jest.mock('../../../src/util/logger');

describe('Test Recalls Endpoint', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  const mockDefaultResponse: APIGatewayProxyResult = addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify({
      manufacturer: null,
      hasRecall: false,
    }),
  });

  describe('WHEN the feature flag is not defined', () => {
    it('SHOULD return a 500 response', async () => {
      mockGetProfile.mockResolvedValue({
        someIncorrectFlag: {
          enabled: true,
        },
      });

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toBe(500);
      expect(res.body).toBe('Recall Feature Flag is undefined');
    });
  });
  describe('WHEN the feature flag is disabled (FALSE)', () => {
    it('SHOULD return a 200 response and no recalls', async () => {
      mockGetProfile.mockResolvedValue({
        recallsApi: {
          enabled: false,
        },
      });

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toEqual(mockDefaultResponse.statusCode);
      expect(res.body).toEqual(mockDefaultResponse.body);
    });
  });

  describe('WHEN the VIN validation fails', () => {
    it('SHOULD log VIN ERROR and return a 200 response with no recalls', async () => {
      mockGetProfile.mockResolvedValue({
        recallsApi: {
          enabled: true,
        },
      });
      mockValidateSingleVin.mockReturnValue(false);

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toEqual(mockDefaultResponse.statusCode);
      expect(res.body).toEqual(mockDefaultResponse.body);
      expect(logger.error).toHaveBeenCalledWith(formatErrorMessage('VIN provided in path parameter is not valid.'));
    });
  });
  describe('WHEN it cannot retrieve the bearer token from the MOT API', () => {
    it('SHOULD log error and return a 200 response with no recalls', async () => {
      mockGetProfile.mockResolvedValue({
        recallsApi: {
          enabled: true,
        },
      });
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
      mockGetProfile.mockResolvedValue({
        recallsApi: {
          enabled: true,
        },
      });
      mockValidateSingleVin.mockReturnValue(true);
      mockGetBearerToken.mockReturnValue('test');
      mockGetMotRecallsByVin.mockReturnValue(undefined);

      const res = await handler({} as APIGatewayProxyEvent);
      expect(res.statusCode).toEqual(mockDefaultResponse.statusCode);
      expect(res.body).toEqual(mockDefaultResponse.body);
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

      mockGetProfile.mockResolvedValue({
        recallsApi: {
          enabled: true,
        },
      });
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
