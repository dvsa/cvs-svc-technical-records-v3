/* eslint-disable import/first */
const mockProcessRecord = jest.fn();
const mockSyncTestResultInfo = jest.fn();
import { handler } from '../../../src/handler/sync-test-result-info';
import { ERRORS } from '../../../src/util/enum';
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
    it('should throw error if event is empty', async () => {
      await expect(handler({
        Records: [],
      }))
        .rejects.toThrow(ERRORS.EVENT_IS_EMPTY);
    });
    it('should throw error if promise is rejected', async () => {
      mockProcessRecord.mockReturnValue(parsedRecord);
      mockSyncTestResultInfo.mockImplementation(() => Promise.reject(new Error('test error')));
      await expect(handler(queueEvent))
        .rejects.toThrow('test error');
    });
  });
  describe('Success response', () => {
    it('should resolve successfully', async () => {
      mockProcessRecord.mockReturnValue(parsedRecord);
      mockSyncTestResultInfo.mockImplementation(() => Promise.resolve({ passed: '123' }));
      await expect(handler(queueEvent))
        .resolves.toStrictEqual([{ passed: '123' }]);
      expect(mockProcessRecord).toHaveBeenCalledTimes(1);
      expect(mockSyncTestResultInfo).toHaveBeenCalledTimes(1);
    });
  });
});
