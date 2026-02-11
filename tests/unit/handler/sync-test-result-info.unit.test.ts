/* eslint-disable import/first */
const mockProcessRecord = jest.fn();
const mockSyncTestResultInfo = jest.fn();
const mockGetProfile = jest.fn();

import parsedRecord from '../../resources/queue-event-parsed-body.json';
import queueEvent from '../../resources/queue-event.json';

jest.mock('../../../src/processors/processSQSRecord.ts', () => ({
  processRecord: mockProcessRecord,
}));

jest.mock('../../../src/processors/processSyncTestResultInfo.ts', () => ({
  syncTestResultInfo: mockSyncTestResultInfo,
}));

jest.mock('@dvsa/cvs-feature-flags/profiles/vtx', () => ({
  getProfile: mockGetProfile,
}));

jest.mock('../../../src/util/logger');

describe('syncTestResultInfo handler', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  describe('Error handling', () => {
    it('should now throw error if problem with syncTestResulInfo method', async () => {
      const { handler } = await import('../../../src/handler/sync-test-result-info');
      mockGetProfile.mockResolvedValueOnce({
        skipAutomatedProcesses: {
          enabled: false,
          syncTestResultInfo: false,
        },
      });
      mockProcessRecord.mockReturnValue(parsedRecord);
      mockSyncTestResultInfo.mockImplementation(() => Promise.reject(new Error('test error')));
      const failures = (await handler(queueEvent)).batchItemFailures;
      expect(failures).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      expect(failures[0]).toEqual({ itemIdentifier: queueEvent.Records[0].messageId });
    });
  });
  describe('Success response', () => {
    it('should resolve successfully', async () => {
      const { handler } = await import('../../../src/handler/sync-test-result-info');
      mockGetProfile.mockResolvedValueOnce({
        skipAutomatedProcesses: {
          enabled: false,
          syncTestResultInfo: false,
        },
      });
      mockProcessRecord.mockReturnValue(parsedRecord);
      mockSyncTestResultInfo.mockImplementation(() => Promise.resolve({ passed: '123' }));
      expect((await handler(queueEvent)).batchItemFailures).toHaveLength(0);
      expect(mockProcessRecord).toHaveBeenCalledTimes(1);
      expect(mockSyncTestResultInfo).toHaveBeenCalledTimes(1);
    });
  });
  describe('Feature Flag', () => {
    it('should handle featureFlag disabling function and use cache if available', async () => {
      const { handler } = await import('../../../src/handler/sync-test-result-info');
      mockGetProfile.mockResolvedValueOnce({
        skipAutomatedProcesses: {
          enabled: true,
          syncTestResultInfo: true,
        },
      });
      const res = await handler(queueEvent);
      expect(res.batchItemFailures).toHaveLength(0);
      expect(mockProcessRecord).toHaveBeenCalledTimes(0);

      const res2 = await handler(queueEvent);
      expect(res2.batchItemFailures).toHaveLength(0);
      expect(mockProcessRecord).toHaveBeenCalledTimes(0);
      expect(mockGetProfile).toHaveBeenCalledTimes(1);
    });
    it('should ignore logic if skipAutomatedProcesses does not exist on FF', async () => {
      const { handler } = await import('../../../src/handler/sync-test-result-info');
      mockGetProfile.mockResolvedValueOnce({
        someOtherKey: {},
      });
      mockProcessRecord.mockReturnValue(parsedRecord);
      mockSyncTestResultInfo.mockImplementation(() => Promise.resolve({ passed: '123' }));
      expect((await handler(queueEvent)).batchItemFailures).toHaveLength(0);
      expect(mockProcessRecord).toHaveBeenCalledTimes(1);
      expect(mockSyncTestResultInfo).toHaveBeenCalledTimes(1);
    });
  });
});
