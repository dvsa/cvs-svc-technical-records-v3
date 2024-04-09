import { GetObjectCommand, GetObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import logger from "../util/logger";

const s3 = new S3Client({ region: process.env.DYNAMO_AWS_REGION });

export const GetObjectFromS3 = async (bucket: string, key: string): Promise<string>  => {
  try{
    const response: GetObjectCommandOutput = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    return await response.Body?.transformToString() as string;
  }
  catch(error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`an error occurred in the promises ${error}`);
    throw error;
  }
};
