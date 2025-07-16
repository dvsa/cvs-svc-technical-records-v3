import { MotRecalls, MotSecret } from '../../../src/models/motRecalls';
import logger from '../../../src/util/logger';
import * as RecallUtils from '../../../src/util/motRecalls';

jest.mock('../../../src/util/logger');

describe('Recalls util functions', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date());
  });
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  describe('filterMotRecalls', () => {
    let date: Date;
    const emptyResponse = {
      manufacturer: null,
      hasRecall: false,
    };

    beforeEach(() => {
      date = new Date();
    });

    it('should correctly filter a list of 3 when one is a recall', () => {
      const recallResponse = {
        vin: '1234',
        manufacturer: 'test manufacturer',
        recalls: [
          {
            manufacturerCampaignReference: '123ABC',
            dvsaCampaignReference: '1234ABC',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'NOT_FIXED',
          },
          {
            manufacturerCampaignReference: '123CBA',
            dvsaCampaignReference: '1234CBA',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'FIXED',
          },
          {
            manufacturerCampaignReference: 'CBA123',
            dvsaCampaignReference: 'CBA1234',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'FIXED',
          },
        ],
        lastUpdatedDate: '123456',
      };
      const res = RecallUtils.filterMotRecalls(recallResponse as MotRecalls);
      expect(res).toStrictEqual({
        manufacturer: 'test manufacturer',
        hasRecall: true,
      });
    });
    it('SHOULD correctly filter a list of 3 when two are recalls', () => {
      const recallResponse = {
        vin: '1234',
        manufacturer: 'test manufacturer',
        recalls: [
          {
            manufacturerCampaignReference: '123ABC',
            dvsaCampaignReference: '1234ABC',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'NOT_FIXED',
          },
          {
            manufacturerCampaignReference: '123CBA',
            dvsaCampaignReference: '1234CBA',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'NOT_FIXED',
          },
          {
            manufacturerCampaignReference: 'CBA123',
            dvsaCampaignReference: 'CBA1234',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'FIXED',
          },
        ],
        lastUpdatedDate: '123456',
      };
      const res = RecallUtils.filterMotRecalls(recallResponse as MotRecalls);
      expect(res).toStrictEqual({
        manufacturer: 'test manufacturer',
        hasRecall: true,
      });
    });
    it('SHOULD filter to nothing when all dates are in the future', () => {
      const recallResponse = {
        vin: '1234',
        manufacturer: 'test manufacturer',
        recalls: [
          {
            manufacturerCampaignReference: '123ABC',
            dvsaCampaignReference: '1234ABC',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() + 1))).toISOString().split('T')[0],
            repairStatus: 'NOT_FIXED',
          },
          {
            manufacturerCampaignReference: '123CBA',
            dvsaCampaignReference: '1234CBA',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() + 2))).toISOString().split('T')[0],
            repairStatus: 'NOT_FIXED',
          },
        ],
        lastUpdatedDate: '123456',
      };
      const res = RecallUtils.filterMotRecalls(recallResponse as MotRecalls);
      expect(res).toStrictEqual(emptyResponse);
    });
    it('SHOULD filter to nothing when all vehicles are fixed', () => {
      const recallResponse = {
        vin: '1234',
        manufacturer: 'test manufacturer',
        recalls: [
          {
            manufacturerCampaignReference: '123ABC',
            dvsaCampaignReference: '1234ABC',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'FIXED',
          },
          {
            manufacturerCampaignReference: '123CBA',
            dvsaCampaignReference: '1234CBA',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split('T')[0],
            repairStatus: 'FIXED',
          },
        ],
        lastUpdatedDate: '123456',
      };
      const res = RecallUtils.filterMotRecalls(recallResponse as MotRecalls);
      expect(res).toStrictEqual(emptyResponse);
    });
    it('SHOULD filter to nothing when all vehicles are fixed and all dates are in the future', () => {
      const recallResponse = {
        vin: '1234',
        manufacturer: 'test manufacturer',
        recalls: [
          {
            manufacturerCampaignReference: '123ABC',
            dvsaCampaignReference: '1234ABC',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() + 1))).toISOString().split('T')[0],
            repairStatus: 'FIXED',
          },
          {
            manufacturerCampaignReference: '123CBA',
            dvsaCampaignReference: '1234CBA',
            recallCampaignStartDate: new Date((date.setDate(date.getDate() + 1))).toISOString().split('T')[0],
            repairStatus: 'FIXED',
          },
        ],
        lastUpdatedDate: '123456',
      };
      const res = RecallUtils.filterMotRecalls(recallResponse as MotRecalls);
      expect(res).toStrictEqual(emptyResponse);
    });
  });
  describe('getBearerToken', () => {
    it('SHOULD return undefined and log an error message when it fails to retrieve bearer token', async () => {
      const mockErr = 'test failed successfully';
      global.fetch = jest.fn().mockImplementation(() => {
        throw Error(mockErr);
      });

      const res = await RecallUtils.getBearerToken({} as MotSecret);
      expect(logger.error).toHaveBeenCalledWith(`Failed to get bearer token: Error: ${mockErr}`);
      expect(res).toBeUndefined();
    });
    it('SHOULD return the token upon successful retrieval of bearer token', async () => {
      global.fetch = jest.fn().mockImplementation(() => ({
        status: 200,
        json: () => ({
          access_token: 'test',
        }),
      } as unknown as Response));

      const res = await RecallUtils.getBearerToken({} as MotSecret);
      expect(res).toBe('test');
    });
  });
  describe('getMotRecallsByVin', () => {
    const mockMotSecret = {
      clientID: 'ID',
      clientSecret: 'ClientSecret',
      scopeURL: 'ScopeURL',
      accessTokenURL: 'AcessTokenURL',
      apiKey: 'ApiKey',
      apiURL: 'ApiUrl',
    } as MotSecret;
    it('SHOULD use the bearer token in cache, and call MOT API', async () => {
      const cache: Map<string, string> = new Map();
      cache.set('bearerToken', 'grizzly');

      global.fetch = jest.fn().mockImplementation(() => ({
        status: 200,
        json: () => ({
          data: {} as MotRecalls,
        }),
      } as unknown as Response));

      const bearerSpy = jest.spyOn(RecallUtils, 'getBearerToken');

      const res = await RecallUtils.getMotRecallsByVin('test', cache, mockMotSecret);
      expect(bearerSpy).not.toHaveBeenCalled();
      expect(res).toBeDefined();
    });
    describe('when cache has no or invalid bearer token', () => {
      beforeEach(() => {
        global.fetch = jest.fn().mockImplementation(() => ({
          status: 403,
          json: () => ({}),
        } as unknown as Response));
      });
      it('SHOULD return undefined when it fails to retrieve a new bearer token', async () => {
        const cache: Map<string, string> = new Map();
        cache.set('bearerToken', 'grizzly');

        const bearerSpy = jest.spyOn(RecallUtils, 'getBearerToken').mockResolvedValue(undefined);

        const res = await RecallUtils.getMotRecallsByVin('test', cache, mockMotSecret);
        expect(bearerSpy).toBeCalledWith(mockMotSecret);
        expect(res).toBeUndefined();
      });
      it('SHOULD assign new bearer token to the cache', async () => {
        const cache: Map<string, string> = new Map();
        const bearerSpy = jest.spyOn(RecallUtils, 'getBearerToken').mockResolvedValue('polar');

        await RecallUtils.getMotRecallsByVin('test', cache, mockMotSecret);
        expect(cache.get('bearerToken')).toBe('polar');
        expect(bearerSpy).toBeCalledWith(mockMotSecret);
      });
    });
    describe('when the service errors', () => {
      it('should throw an error and log it', async () => {
        const cache: Map<string, string> = new Map();
        cache.set('bearerToken', 'grizzly');

        global.fetch = jest.fn().mockImplementation(() => ({
          json: '123',
        } as unknown as Response));

        const res = await RecallUtils.getMotRecallsByVin('test', cache, mockMotSecret);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('failed calling MOT endpoint: Error:'));
        expect(res).toBeUndefined();
      });
    });
  });
});
