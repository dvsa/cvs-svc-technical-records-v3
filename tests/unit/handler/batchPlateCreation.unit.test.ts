import { SQSEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { TechRecordGETHGV, TechRecordGETTRL } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';
import { TechRecordComplete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-status';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../../../src/services/database';
import { formatTechRecord } from '../../../src/util/formatTechRecord';
import { addToSqs } from '../../../src/services/sqs';
import { handler } from '../../../src/handler/batchPlateCreation';
import logger, { logError } from '../../../src/util/logger';
import { StatusCode } from '../../../src/util/enum';

jest.mock('uuid');
jest.mock('../../../src/services/database');
jest.mock('../../../src/util/formatTechRecord');
jest.mock('../../../src/services/sqs');
jest.mock('../../../src/util/logger');
jest.mock('../../../src/util/errorMessage');
jest.mock('@aws-sdk/client-sqs');

describe('Batch Plate Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DOC_GEN_SQS_QUEUE = 'test-queue-url';
  });

  it('should process valid records successfully', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '12345690', createdTimestamp: '2024-01-30T09:10:32.594Z' },
      { systemNumber: '12345691', createdTimestamp: '2024-01-30T09:01:10.851Z' },
    ]);

    const mockDbRecord1 = {
      systemNumber: '12345690',
      createdTimestamp: '2024-01-30T09:10:32.594Z',
      techRecord_statusCode: StatusCode.CURRENT,
      techRecord_vehicleType: 'hgv',
    } as TechRecordGETHGV;
    const mockDbRecord2 = {
      systemNumber: '12345691',
      createdTimestamp: '2024-01-30T09:01:10.851Z',
      techRecord_statusCode: StatusCode.CURRENT,
      techRecord_vehicleType: 'trl',
    } as TechRecordGETTRL;

    (getBySystemNumberAndCreatedTimestamp as jest.Mock)
      .mockResolvedValueOnce(mockDbRecord1)
      .mockResolvedValueOnce(mockDbRecord2);

    (formatTechRecord as jest.Mock).mockImplementation((record) => ({
      ...record,
      techRecord_plates: [],
    } as TechRecordComplete));

    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');

    await handler(mockEvent);

    expect(getBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(2);
    expect(inPlaceRecordUpdate).toHaveBeenCalledTimes(2);
    expect(addToSqs).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith('Batch Plate: Updated 2 tech records and added 2 to SQS');
    expect(logError).not.toHaveBeenCalled();
  });

  it('should handle missing records', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '1234234', createdTimestamp: '2023-01-01T00:00:00.000Z' },
    ]);

    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(undefined);

    await expect(handler(mockEvent)).rejects.toThrow('Missing record: sysNum 1234234, timestamp 2023-01-01T00:00:00.000Z');
    expect(inPlaceRecordUpdate).not.toHaveBeenCalled();
    expect(addToSqs).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith('Error in batch processing', new Error(
      'Missing record: sysNum 1234234, timestamp 2023-01-01T00:00:00.000Z',
    ));
  });

  it('should handle non current records', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '12345679', createdTimestamp: '2024-02-05T11:40:52.073Z' },
    ]);

    const mockDbRecord = {
      systemNumber: '12345679',
      createdTimestamp: '2024-02-05T11:40:52.073Z',
      techRecord_statusCode: 'archived' as StatusCode,
      techRecord_vehicleType: 'hgv',
    } as TechRecordGETHGV;
    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);

    await expect(handler(mockEvent)).rejects.toThrow('Non current record: statusCode archived');
    expect(inPlaceRecordUpdate).not.toHaveBeenCalled();
    expect(addToSqs).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith(
      'Error in batch processing',
      new Error('Non current record: statusCode archived'),
    );
  });

  it('should handle non TRL and non HGV records', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '43124234', createdTimestamp: '2024-01-08T09:14:36.351Z' },
    ]);
    const mockDbRecord = {
      systemNumber: '43124234',
      createdTimestamp: '2024-01-08T09:14:36.351Z',
      techRecord_statusCode: StatusCode.CURRENT,
      techRecord_vehicleType: 'lgv',
    };
    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);

    await expect(handler(mockEvent)).rejects.toThrow('Invalid vehicle type: lgv');
    expect(inPlaceRecordUpdate).not.toHaveBeenCalled();
    expect(addToSqs).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith('Error in batch processing', new Error('Invalid vehicle type: lgv'));
  });

  it('should not add a new plate when a batch issuer plate already exists', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '5345635', createdTimestamp: '2024-03-17T10:00:00.000Z' },
    ]);
    const mockDbRecord = {
      systemNumber: '5345635',
      createdTimestamp: '2024-03-17T10:00:00.000Z',
      techRecord_statusCode: StatusCode.CURRENT,
      techRecord_vehicleType: 'hgv',
      techRecord_plates: [
        {
          plateSerialNumber: 'existing-batch-plate',
          plateIssueDate: '2024-01-01T00:00:00.000Z',
          plateReasonForIssue: 'Replacement',
          plateIssuer: 'CVS Batch Plate Generation',
        },
      ],
    } as TechRecordGETHGV;

    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);
    (formatTechRecord as jest.Mock).mockImplementation((record) => ({ ...record } as TechRecordGETHGV));

    await handler(mockEvent);

    expect(logger.info).toHaveBeenCalledWith('Batch Plate: Updated 0 tech records and added 0 to SQS');
    expect(inPlaceRecordUpdate).not.toHaveBeenCalled();
    expect(addToSqs).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it('should add a new plate when the record has no existing plates', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '9876543', createdTimestamp: '2024-03-20T10:00:00.000Z' },
    ]);

    const mockDbRecord = {
      systemNumber: '9876543',
      createdTimestamp: '2024-03-20T10:00:00.000Z',
      techRecord_statusCode: StatusCode.CURRENT,
      techRecord_vehicleType: 'hgv',
    };

    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);
    (formatTechRecord as jest.Mock).mockImplementation((record) => ({ ...record } as TechRecordGETHGV));
    (uuidv4 as jest.Mock).mockReturnValue('new-plate-uuid');

    const mockDate = new Date('2024-03-20T12:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    await handler(mockEvent);

    expect(inPlaceRecordUpdate).toHaveBeenCalledTimes(1);
    expect(addToSqs).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Batch Plate: Updated 1 tech records and added 1 to SQS');
    expect(logError).not.toHaveBeenCalled();
  });

  it('should handle errors during individual record processing', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '6574567', createdTimestamp: '2023-01-01T00:00:00.000Z' },
      { systemNumber: '6574568', createdTimestamp: '2023-01-02T00:00:00.000Z' },
    ]);
    const mockError = new Error('DynamoDB error');
    (getBySystemNumberAndCreatedTimestamp as jest.Mock)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({
        systemNumber: '6574568',
        createdTimestamp: '2023-01-02T00:00:00.000Z',
        techRecord_statusCode: StatusCode.CURRENT,
        techRecord_vehicleType: 'hgv',
      });

    (formatTechRecord as jest.Mock).mockImplementation((record) => ({
      ...record,
      techRecord_plates: [],
    } as TechRecordGETHGV));

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
    expect(inPlaceRecordUpdate).toHaveBeenCalledTimes(1);
    expect(addToSqs).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith('Error in batch processing', new Error('DynamoDB error'));
  });

  it('should use an empty string for SQS queue URL when DOC_GEN_SQS_QUEUE is undefined', async () => {
    const mockEvent = createMockSQSEvent([
      { systemNumber: '1122334', createdTimestamp: '2024-03-21T10:00:00.000Z' },
    ]);

    const mockDbRecord = {
      systemNumber: '1122334',
      createdTimestamp: '2024-03-21T10:00:00.000Z',
      techRecord_statusCode: StatusCode.CURRENT,
      techRecord_vehicleType: 'hgv',
      techRecord_plates: [],
    };

    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);
    (formatTechRecord as jest.Mock).mockImplementation((record) => ({ ...record } as TechRecordGETHGV));
    (uuidv4 as jest.Mock).mockReturnValue('new-uuid');

    const mockDate = new Date('2024-03-21T12:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    const originalEnv = process.env.DOC_GEN_SQS_QUEUE;
    delete process.env.DOC_GEN_SQS_QUEUE;

    await handler(mockEvent);

    process.env.DOC_GEN_SQS_QUEUE = originalEnv;

    expect(addToSqs).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Batch Plate: Updated 1 tech records and added 1 to SQS');
    expect(logError).not.toHaveBeenCalled();
  });
});

function createMockSQSEvent(records: { systemNumber: string; createdTimestamp: string }[]): SQSEvent {
  return {
    Records: records.map((record) => ({
      messageId: 'messageId',
      receiptHandle: 'receiptHandle',
      body: JSON.stringify(record),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1523232000000',
        SenderId: '123456789012',
        ApproximateFirstReceiveTimestamp: '1523232000001',
      },
      messageAttributes: {},
      md5OfBody: 'test-md5',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:14342343:MyQueue',
      awsRegion: 'us-east-1',
    })),
  };
}
