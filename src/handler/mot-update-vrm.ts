import { S3Event } from "aws-lambda";
import logger from '../util/logger';
import { ProcessedMotCherishedTransfers } from "../models/motCherishedTransfer";
import { searchByCriteria, updateVehicle } from "../services/database";
import { SearchCriteria } from "../models/search";
import { GetObjectFromS3 } from "../services/s3";
import { processMotCherishedTransfer } from "../processors/processMotCherishedTransfer";
import { StatusCode } from "../util/enum";
import { publish } from "../services/sns";
import { SNSMessageBody } from "../models/updateVrm";
import { processCherishedTransfer } from "../processors/processCherishedTransfer";
import { TechRecordType } from "@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb";

export const handler = async (event: S3Event) => {
  logger.info('mot-update-vrm lambda triggered');

  try {
    const bucket: string = event.Records[0].s3.bucket.name;
    const key: string = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const rawObjectBody = await GetObjectFromS3(bucket, key);
    const processedTransfers: ProcessedMotCherishedTransfers = processMotCherishedTransfer(rawObjectBody);
    const cherishedTransfers = processedTransfers.cherishedTransfers;

    let recordsToSend: SNSMessageBody[] = [];
    let recordsFailed: number = 0;

    cherishedTransfers.forEach(async (cherishedTransfer) => {
      const allRecords = await searchByCriteria(SearchCriteria.VIN, cherishedTransfer.vin);
      const allCurrentRecords = allRecords.filter(x => x.techRecord_statusCode === StatusCode.CURRENT);
      const matchingCurrentVrmRecords = allCurrentRecords.find(x => x.primaryVrm === cherishedTransfer.vrm);

      if(allCurrentRecords.length > 1) {
        recordsFailed++;
        logger.info(`Duplicate current records found for VIN ${cherishedTransfer.vin}`);
      }
      else if(matchingCurrentVrmRecords){
        recordsFailed++;
        logger.info(`No update needed for VRM ${cherishedTransfer.vrm} and VIN ${cherishedTransfer.vin}`);
      }
      else {
        const { recordsToArchive, recordsToUpdate } = processCherishedTransfer(
          {} as any,
          cherishedTransfer.vrm,
          allCurrentRecords[0] as TechRecordType<'get'>,
        );

        await updateVehicle(recordsToArchive, recordsToUpdate);

        recordsToUpdate.forEach((record) => recordsToSend.push({ ...record, userEmail: 'something@goes.here' }));
      }
    });

    await publish(JSON.stringify(recordsToSend), process.env.VRM_TRANSFERRED_ARN ?? '');
    logger.info(`File name: ${processedTransfers.fileName}`);
    logger.info(`Total Records Processed: ${cherishedTransfers.length}`);
    logger.info(`Total Failures: ${recordsFailed}`);
    logger.info(`Total Not Matched: ${cherishedTransfers.length - recordsToSend.length}`);
    logger.info(`Total Records Successfully Matched & Processed: ${recordsToSend.length}`);
  }
  catch(error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`an error occurred during processing mot update vrm ${error}`);
    throw error;
  }
}
