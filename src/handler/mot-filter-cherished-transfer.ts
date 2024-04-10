import { S3Event } from "aws-lambda";
import logger from '../util/logger';
import { MotCherishedTransfer } from "../models/motCherishedTransfer";
import { searchByCriteria } from "../services/database";
import { SearchCriteria } from "../models/search";
import { GetObjectFromS3 } from "../services/s3";
import { processMotCherishedTransfer } from "../processors/processMotCherishedTransfer";
import { StatusCode } from "../util/enum";
import { addToSqs } from "../services/sqs";
import { SQSRequestBody } from "../models/sqsPayload";
import { MotSQSRequestBody } from "../models/motSqsPayload";


export const handler = async (event: S3Event) => {
  logger.info('mot-filter-cherished-transfer lambda triggered');

  try {
    const bucket: string = event.Records[0].s3.bucket.name;
    const key: string = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    const rawObjectBody = await GetObjectFromS3(bucket, key);
    const cherishedTransfers: MotCherishedTransfer[] = processMotCherishedTransfer(rawObjectBody);

    cherishedTransfers.forEach(async (cherishedTransfer) => {
      const allRecords = await searchByCriteria(SearchCriteria.VIN, cherishedTransfer.vin);
      const allCurrentRecords = allRecords.filter(x => x.techRecord_statusCode === StatusCode.CURRENT);
      const matchingCurrentVrmRecords = allCurrentRecords.find(x => x.primaryVrm === cherishedTransfer.vrm);

      if(allCurrentRecords.length > 1) {
        logger.info(`Duplicate current records found for VIN ${cherishedTransfer.vin}`);
      }
      else if(matchingCurrentVrmRecords){
        logger.info(`No update needed for VRM ${cherishedTransfer.vrm} and VIN ${cherishedTransfer.vin}`);
      }
      else {
        const requestBody: MotSQSRequestBody = {
          techRecord: allCurrentRecords[0],
          vrm: cherishedTransfer.vrm
        };

        await addToSqs(requestBody, process.env.UPDATE_VRM_SQS_QUEUE ?? '');
      }
    });
  }
  catch(error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`an error occurred during processing mot filtered cherish transfers ${error}`);
    throw error;
  }
}
