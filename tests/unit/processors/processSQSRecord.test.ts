import { processRecord } from '../../../src/processors/processSQSRecord';
import event from '../../resources/queue-event.json';

describe('Process SQS Record', () => {
  it('returns parsed event data', () => {
    const record = processRecord(event.Records[0]);
    console.log(record);
    expect(record?.systemNumber).toBe('5000');
  });
  it('returns undefined if missing record', () => {
    const record = event.Records[0];
    record.body = '{}';
    expect(processRecord(record)).toBeUndefined();
  });
});
