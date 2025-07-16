import {
  CopyObjectCommand, DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Event } from 'aws-lambda';
import { BatchPlateData } from '../models/batchPlate';
import logger, { logError } from '../util/logger';

const s3Client = new S3Client({ region: process.env.DYNAMO_AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.DYNAMO_AWS_REGION });

export const handler = async (event: S3Event): Promise<void> => {
  logger.info('Update end point called');

  try {
    await Promise.all(event.Records.map(processRecord));
    logger.info(`Successfully processed ${event.Records.length} files.`);
  } catch (error) {
    logError('Failed to process one or more files', error);
    throw error;
  }
};
async function processRecord(record: S3Event['Records'][0]): Promise<void> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  logger.info(`Processing file: ${key} from ${bucket}`);

  try {
    const data = await retrieveJSON(bucket, key);
    await Promise.all(data.map((item) => sendToQueue(item)));
    await moveProcessedFile(bucket, key);
    logger.info(`Successfully processed and moved file: ${key}}`);
  } catch (error) {
    logError(`Error processing file ${key}`, error);
    throw error;
  }
}

/**
 * This function will retrieve the json file from the provided s3 bucket
 * Then, extract and validate the json file content
 * @param bucket
 * @param key
 */
async function retrieveJSON(bucket: string, key: string): Promise<BatchPlateData[]> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  const bodyContents = await response.Body?.transformToString();

  if (!bodyContents) {
    throw new Error('Empty JSON file');
  }

  try {
    return JSON.parse(bodyContents) as BatchPlateData[];
  } catch (error) {
    throw new Error(`Invalid JSON in file: ${error instanceof Error ? error.message : (error as string)}`);
  }
}

/**
 * This function will send the systemNumber and createdTimestamp to the doc-gen service.
 * @param item
 */
async function sendToQueue(item: BatchPlateData): Promise<void> {
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(item),
  });

  await sqsClient.send(command);
}

/**
 * This function will copy the file that has been processed and move it to the processed folder
 * Then, it will delete the original.
 * @param bucket
 * @param key
 */
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
