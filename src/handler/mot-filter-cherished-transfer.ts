import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import logger from '../util/logger';
import { MotCherishedTransfer } from "../models/motCherishedTransfer";
import { convertCsvToMotCherishedTransfer } from "../util/convertCsvToMotCherishedTransfer";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: S3Event): Promise<String | undefined> => {
  logger.info('mot-filter-cherished-transfer lambda triggered');

  try {
    const bucket: string = event.Records[0].s3.bucket.name;
    const key: string = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    const response: GetObjectCommandOutput = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    const rawBody: string = await response.Body?.transformToString() as string;
    const cherishedTransfers: MotCherishedTransfer[] = convertCsvToMotCherishedTransfer(rawBody);

    console.log(cherishedTransfers);
  }
  catch(error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`an error occurred in the promises ${error}`);
    throw error;
  }

  return "";
}
