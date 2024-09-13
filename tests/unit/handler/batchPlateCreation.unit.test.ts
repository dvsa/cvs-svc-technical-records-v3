import { SQSEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { TechRecordHGV } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordGETHGV } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';
import technicalRecordsData from '../../resources/technical-records-v3-no-plates.json';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../../../src/services/database';
import { flattenArrays, formatTechRecord } from '../../../src/util/formatTechRecord';
import { addToSqs } from '../../../src/services/sqs';
import { handler } from '../../../src/handler/batchPlateCreation';
import logger from '../../../src/util/logger';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { ERRORS } from '../../../src/util/enum';

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
      {
        systemNumber: '12345690',
        createdTimestamp: '2024-01-30T09:10:32.594Z',
      },
      {
        systemNumber: '12345691',
        createdTimestamp: '2024-01-30T09:01:10.851Z',
      },
    ]);

    const mockDbRecord1 = technicalRecordsData.find((record) => record.systemNumber === '12345690');
    const mockDbRecord2 = technicalRecordsData.find((record) => record.systemNumber === '12345691');
    const getBySystemNumberAndCreatedTimestampMock = jest.fn()
      .mockResolvedValueOnce(mockDbRecord1)
      .mockResolvedValueOnce(mockDbRecord2);

    (getBySystemNumberAndCreatedTimestamp as jest.Mock) = getBySystemNumberAndCreatedTimestampMock;

    (formatTechRecord as jest.Mock).mockImplementation((record) => ({
      ...record as TechRecordHGV,
      techRecord_plates: [],
    }));
    (flattenArrays as jest.Mock).mockImplementation((record: TechRecordHGV) => record);
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');

    await handler(mockEvent);

    expect(getBySystemNumberAndCreatedTimestampMock)
      .toHaveBeenCalledTimes(2);
    expect(getBySystemNumberAndCreatedTimestampMock.mock.calls)
      .toEqual([
        ['12345690', '2024-01-30T09:10:32.594Z'],
        ['12345691', '2024-01-30T09:01:10.851Z'],
      ]);

    expect(inPlaceRecordUpdate)
      .toHaveBeenCalledTimes(2);
    expect(addToSqs)
      .toHaveBeenCalledTimes(2);
    expect(logger.info)
      .toHaveBeenCalledWith('Batch Plate: Updated 2 tech records and added 2 to sqs');
  });

  it('should handle missing records', async () => {
    const mockEvent = createMockSQSEvent([
      {
        systemNumber: '1234234',
        createdTimestamp: '2023-01-01T00:00:00.000Z',
      },
    ]);

    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue({});

    await handler(mockEvent);

    expect(logger.error)
      .toHaveBeenCalledWith('Missing record with sysNum 1234234 and timestamp 2023-01-01T00:00:00.000Z');
    expect(inPlaceRecordUpdate)
      .not
      .toHaveBeenCalled();
    expect(addToSqs)
      .not
      .toHaveBeenCalled();
  });

  it('should handle non current records', async () => {
    const mockEvent = createMockSQSEvent([
      {
        systemNumber: '12345679',
        createdTimestamp: '2024-02-05T11:40:52.073Z',
      },
    ]);

    const mockDbRecord = technicalRecordsData.find((record) => record.systemNumber === '12345679');
    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);
    await handler(mockEvent);

    expect(logger.error)
      .toHaveBeenCalledWith('Non current record with sysNum 12345679 and timestamp 2024-02-05T11:40:52.073Z');
    expect(inPlaceRecordUpdate)
      .not
      .toHaveBeenCalled();
    expect(addToSqs)
      .not
      .toHaveBeenCalled();
  });

  it('should handle non TRL and non HGV records', async () => {
    const mockEvent = createMockSQSEvent([
      {
        systemNumber: 'SNINVALIDCLASS',
        createdTimestamp: '2024-01-08T09:14:36.351Z',
      },
    ]);
    const mockDbRecord = technicalRecordsData.find((record) => record.systemNumber === 'SNINVALIDCLASS');
    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);

    await handler(mockEvent);

    expect(logger.error)
      .toHaveBeenCalledWith('Non trl or hgv record with sysNum SNINVALIDCLASS and timestamp 2024-01-08T09:14:36.351Z');
    expect(inPlaceRecordUpdate)
      .not
      .toHaveBeenCalled();
    expect(addToSqs)
      .not
      .toHaveBeenCalled();
  });

  it('should handle a record without existing plates', async () => {
    const mockEvent = createMockSQSEvent([
      {
        systemNumber: '5235234',
        createdTimestamp: '2024-03-15T10:00:00.000Z',
      },
    ]);
    const mockDbRecord = {
      systemNumber: '5235234',
      createdTimestamp: '2024-03-15T10:00:00.000Z',
      techRecord_statusCode: 'current',
      techRecord_vehicleType: 'hgv',
    };
    const mockInPlaceRecordUpdate = jest.mocked(inPlaceRecordUpdate);

    jest.mocked(getBySystemNumberAndCreatedTimestamp)
      .mockResolvedValue(mockDbRecord as TechRecordGETHGV);
    (formatTechRecord as jest.Mock).mockImplementation((record) => ({ ...record } as TechRecordHGV));
    (flattenArrays as jest.Mock).mockImplementation((record: TechRecordHGV) => record);
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');
    const mockDate = new Date('2024-03-16T12:00:00.000Z');
    jest.spyOn(global, 'Date')
      .mockImplementation(() => mockDate);

    await handler(mockEvent);

    expect(getBySystemNumberAndCreatedTimestamp)
      .toHaveBeenCalledWith('5235234', '2024-03-15T10:00:00.000Z');

    expect(inPlaceRecordUpdate)
      .toHaveBeenCalledTimes(1);
    const updatedRecord = mockInPlaceRecordUpdate.mock.calls[0][0] as TechRecordHGV;

    expect(updatedRecord.techRecord_plates)
      .toBeDefined();
    expect(updatedRecord.techRecord_plates)
      .toHaveLength(1);
    expect(updatedRecord.techRecord_plates![0])
      .toEqual({
        plateSerialNumber: 'mock-uuid',
        plateIssueDate: '2024-03-16T12:00:00.000Z',
        plateReasonForIssue: 'Replacement',
        plateIssuer: 'CVS Batch Plate Generation',
      });
    expect(addToSqs)
      .toHaveBeenCalledTimes(1);
    expect(logger.info)
      .toHaveBeenCalledWith('Batch Plate: Updated 1 tech records and added 1 to sqs');
  });

  it('should handle a record with existing plates but no batch issuer plate', async () => {
    const mockEvent = createMockSQSEvent([
      {
        systemNumber: '325435',
        createdTimestamp: '2024-03-16T10:00:00.000Z',
      },
    ]);
    const mockDbRecord = {
      systemNumber: '325435',
      createdTimestamp: '2024-03-16T10:00:00.000Z',
      techRecord_statusCode: 'current',
      techRecord_vehicleType: 'hgv',
      techRecord_plates: [
        {
          plateSerialNumber: '1232-1234-1234',
          plateIssueDate: '2024-01-01T00:00:00.000Z',
          plateReasonForIssue: 'Original',
          plateIssuer: 'Some Other Issuer',
        },
      ],
    };
    const mockInPlaceRecordUpdate = jest.mocked(inPlaceRecordUpdate);
    jest.mocked(getBySystemNumberAndCreatedTimestamp)
      .mockResolvedValue(mockDbRecord as TechRecordGETHGV);
    (formatTechRecord as jest.Mock).mockImplementation((record) => ({ ...record } as TechRecordHGV));
    (flattenArrays as jest.Mock).mockImplementation((record: TechRecordHGV) => record);
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');
    const mockDate = new Date('2024-03-16T12:00:00.000Z');
    jest.spyOn(global, 'Date')
      .mockImplementation(() => mockDate);

    await handler(mockEvent);

    expect(getBySystemNumberAndCreatedTimestamp)
      .toHaveBeenCalledWith('325435', '2024-03-16T10:00:00.000Z');

    expect(inPlaceRecordUpdate)
      .toHaveBeenCalledTimes(1);
    const updatedRecord = mockInPlaceRecordUpdate.mock.calls[0][0] as TechRecordHGV;
    expect(updatedRecord.techRecord_plates)
      .toHaveLength(2);
    expect(updatedRecord.techRecord_plates![1])
      .toEqual({
        plateSerialNumber: 'mock-uuid',
        plateIssueDate: '2024-03-16T12:00:00.000Z',
        plateReasonForIssue: 'Replacement',
        plateIssuer: 'CVS Batch Plate Generation',
      });

    expect(addToSqs)
      .toHaveBeenCalledTimes(1);
    expect(logger.info)
      .toHaveBeenCalledWith('Batch Plate: Updated 1 tech records and added 1 to sqs');
  });

  it('should not add a new plate when a batch issuer plate already exists', async () => {
    const mockEvent = createMockSQSEvent([
      {
        systemNumber: '5345635',
        createdTimestamp: '2024-03-17T10:00:00.000Z',
      },
    ]);
    const mockDbRecord = {
      systemNumber: '5345635',
      createdTimestamp: '2024-03-17T10:00:00.000Z',
      techRecord_statusCode: 'current',
      techRecord_vehicleType: 'hgv',
      techRecord_plates: [
        {
          plateSerialNumber: 'existing-batch-plate',
          plateIssueDate: '2024-01-01T00:00:00.000Z',
          plateReasonForIssue: 'Replacement',
          plateIssuer: 'CVS Batch Plate Generation',
        },
      ],
    };

    (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockResolvedValue(mockDbRecord);
    (formatTechRecord as jest.Mock).mockImplementation((record) => ({ ...record } as TechRecordHGV));

    await handler(mockEvent);

    expect(getBySystemNumberAndCreatedTimestamp)
      .toHaveBeenCalledWith('5345635', '2024-03-17T10:00:00.000Z');
    expect(inPlaceRecordUpdate)
      .not
      .toHaveBeenCalled();
    expect(addToSqs)
      .not
      .toHaveBeenCalled();
    expect(logger.info)
      .toHaveBeenCalledWith('Batch Plate: Updated 0 tech records and added 0 to sqs');
  });

  describe('Error Handling', () => {
    it('should handle errors during individual record processing', async () => {
      const mockEvent = createMockSQSEvent([
        {
          systemNumber: '6574567',
          createdTimestamp: '2023-01-01T00:00:00.000Z',
        },
      ]);
      const mockError = new Error('Database error');
      (getBySystemNumberAndCreatedTimestamp as jest.Mock).mockRejectedValueOnce(mockError);

      await handler(mockEvent);

      expect(logger.error)
        .toHaveBeenCalledWith('6574567, 2023-01-01T00:00:00.000Z, Error: Database error');
      expect(logger.info)
        .toHaveBeenCalledWith('Batch Plate: Updated 0 tech records and added 0 to sqs');
    });

    it('should handle errors in handler', async () => {
      const mockEvent = createMockSQSEvent([
        {
          systemNumber: '74575467',
          createdTimestamp: '2023-01-01T00:00:00.000Z',
        },
      ]);
      (JSON.parse as jest.Mock) = jest.fn()
        .mockImplementation(() => {
          throw new Error('JSON parse error');
        });
      (formatErrorMessage as jest.Mock).mockReturnValue('Formatted error message');

      await handler(mockEvent);

      expect(logger.error)
        .toHaveBeenCalledWith(expect.any(Error));
      expect(formatErrorMessage)
        .toHaveBeenCalledWith(ERRORS.FAILED_UPDATE_MESSAGE);
      expect(logger.error)
        .toHaveBeenCalledWith('Formatted error message');
    });
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
      eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:MyQueue',
      awsRegion: 'us-east-1',
    })),
  };
}
