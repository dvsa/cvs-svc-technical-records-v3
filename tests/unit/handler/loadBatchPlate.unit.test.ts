import { S3Event } from 'aws-lambda';
import {
  S3Client, CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { handler } from '../../../src/handler/loadBatchPlate';
import logger from '../../../src/util/logger';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-sqs');
jest.mock('../../../src/util/logger');

const mockS3Send = jest.fn();
const mockSQSSend = jest.fn();

(S3Client.prototype.send as jest.Mock) = mockS3Send;
(SQSClient.prototype.send as jest.Mock) = mockSQSSend;

describe('S3 Event Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DYNAMO_AWS_REGION = 'eu-west-1';
    process.env.SQS_QUEUE_URL = 'https://sqs.eu-west-1.amazonaws.com/123456789012/test-queue';
  });

  it('should process valid records successfully', async () => {
    const mockEvent = createMockS3Event(['test-file1.json', 'test-file2.json']);
    const mockData = [{ systemNumber: '12345', createdTimestamp: '2023-01-01T00:00:00.000Z' }];

    mockS3Send.mockImplementation(() => ({
      Body: { transformToString: () => Promise.resolve(JSON.stringify(mockData)) },
    }));

    mockSQSSend.mockResolvedValue({});

    await handler(mockEvent);

    expect(mockS3Send).toHaveBeenCalledTimes(6);
    expect(mockSQSSend).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith('Successfully processed 2 files.');
  });

  it('should handle empty JSON files', async () => {
    const mockEvent = createMockS3Event(['emptyFile.json']);

    mockS3Send.mockResolvedValue({
      Body: { transformToString: () => Promise.resolve('') },
    });

    await expect(handler(mockEvent)).rejects.toThrow('Empty JSON file');
    expect(mockS3Send).toHaveBeenCalledTimes(1);
    expect(mockSQSSend).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON files', async () => {
    const mockEvent = createMockS3Event(['invalidFile.json']);

    mockS3Send.mockResolvedValue({
      Body: { transformToString: () => Promise.resolve('{ invalid json }') },
    });

    await expect(handler(mockEvent)).rejects.toThrow('Invalid JSON in file');
    expect(mockS3Send).toHaveBeenCalledTimes(1);
    expect(mockSQSSend).not.toHaveBeenCalled();
  });

  it('should handle S3 errors', async () => {
    const mockEvent = createMockS3Event(['errorFile.json']);

    mockS3Send.mockRejectedValue(new Error('S3 Error'));

    await expect(handler(mockEvent)).rejects.toThrow('S3 Error');
    expect(mockS3Send).toHaveBeenCalledTimes(1);
    expect(mockSQSSend).not.toHaveBeenCalled();
  });

  it('should handle SQS errors', async () => {
    const mockEvent = createMockS3Event(['testFile.json']);
    const mockData = [{ systemNumber: '12345', createdTimestamp: '2023-01-01T00:00:00.000Z' }];

    mockS3Send.mockResolvedValue({
      Body: { transformToString: () => Promise.resolve(JSON.stringify(mockData)) },
    });

    mockSQSSend.mockRejectedValue(new Error('SQS Error'));

    await expect(handler(mockEvent)).rejects.toThrow('SQS Error');
    expect(mockS3Send).toHaveBeenCalledTimes(1);
    expect(mockSQSSend).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when moving processed files', async () => {
    const mockEvent = createMockS3Event(['testFile.json']);
    const mockData = [{ systemNumber: '12345', createdTimestamp: '2023-01-01T00:00:00.000Z' }];

    mockS3Send.mockImplementation((command) => {
      if (command instanceof CopyObjectCommand) {
        return Promise.reject(new Error('Copy Error'));
      }
      return Promise.resolve({
        Body: { transformToString: () => Promise.resolve(JSON.stringify(mockData)) },
      });
    });

    mockSQSSend.mockResolvedValue({});

    await expect(handler(mockEvent)).rejects.toThrow('Copy Error');
    expect(mockS3Send).toHaveBeenCalledTimes(2);
    expect(mockSQSSend).toHaveBeenCalledTimes(1);
  });
});

function createMockS3Event(keys: string[]): S3Event {
  return {
    Records: keys.map((key) => ({
      eventVersion: '2.0',
      eventSource: 'aws:s3',
      awsRegion: 'eu-west-1',
      eventTime: '2024-01-01T02:00:00.000Z',
      eventName: 'ObjectCreated:Put',
      userIdentity: { principalId: 'EXAMPLE' },
      requestParameters: { sourceIPAddress: '0.0.0.0' },
      responseElements: {
        'x-amz-request-id': '123-123123123-123123',
        'x-amz-id-2': '12344-1231243123-123123',
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'testConfiguration',
        bucket: {
          name: 'example-bucket',
          ownerIdentity: { principalId: 'EXAMPLE' },
          arn: 'arn:aws:s3:::example-bucket',
        },
        object: {
          key,
          size: 1024,
          eTag: '435235435gsdfgdfsbsfdbsfgdbs',
          sequencer: '65363456gbdfbgfbdfbf',
        },
      },
    })),
  };
}
