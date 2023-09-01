/* eslint-disable import/first */
const mockProcessRecord = jest.fn();
const mockSyncTestResultInfo = jest.fn();
import { handler } from '../../../src/handler/sync-test-result-info';
import parsedRecord from '../../resources/queue-event-parsed-body.json';
import queueEvent from '../../resources/queue-event.json';

jest.mock('../../../src/processors/processSQSRecord.ts', () => ({
  processRecord: mockProcessRecord,
}));

jest.mock('../../../src/processors/processSyncTestResultInfo.ts', () => ({
  syncTestResultInfo: mockSyncTestResultInfo,
}));
describe('syncTestResultInfo handler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  describe('Error handling', () => {
    it('should now throw error if promise is rejected, but report on that failure', async () => {
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
      mockProcessRecord.mockReturnValue(parsedRecord);
      mockSyncTestResultInfo.mockImplementation(() => Promise.resolve({ passed: '123' }));
      expect((await handler(queueEvent)).batchItemFailures).toHaveLength(0);
      expect(mockProcessRecord).toHaveBeenCalledTimes(1);
      expect(mockSyncTestResultInfo).toHaveBeenCalledTimes(1);
    });
  });
});
