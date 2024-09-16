import { S3CreateEvent } from 'aws-lambda';
import 'dotenv/config';
import logger from '../util/logger';

export const handler = async (event: S3CreateEvent): Promise<void> => {
  logger.info('Load batch plate lambda has been invoked.');
  event.Records.map((record) => logger.info(record.s3));
};
