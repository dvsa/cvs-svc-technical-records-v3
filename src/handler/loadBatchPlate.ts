import {
  S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3CreateEvent } from 'aws-lambda';

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

export type BatchPlateData = {
  systemNumber: string;
  createdTimestamp: string;
};

export const handler = async (event: S3CreateEvent): Promise<void> => {
  console.log('Load batch plate lambda has been invoked.');

  const processPromises = event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      const data = await readJsonFromS3(bucket, key);
      await Promise.all(data.map(sendToQueue));
      await moveProcessedFile(bucket, key);
      console.log(`Successfully processed and moved file: ${key}`);
    } catch (error) {
      console.error(`Error processing file ${key}:`, error);
    }
  });

  await Promise.all(processPromises);
};

async function readJsonFromS3(bucket: string, key: string): Promise<BatchPlateData[]> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  const bodyContents = await response.Body?.transformToString();

  if (!bodyContents) {
    throw new Error('Empty file content');
  }

  return JSON.parse(bodyContents) as BatchPlateData[];
}

async function sendToQueue(item: BatchPlateData): Promise<void> {
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(item),
  });

  await sqsClient.send(command);
}

async function moveProcessedFile(bucket: string, key: string): Promise<void> {
  const newKey = `processed/${key}`;

  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${key}`,
    Key: newKey,
  });
  await s3Client.send(copyCommand);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await s3Client.send(deleteCommand);
}
