import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import 'dotenv/config';
import { PlateRequestBody, Plates } from '../models/plate';
import {
  TechRecordGet, TechRecordHgv,
  TechRecordTrl,
} from '../models/post';
import { DocumentName, SQSRequestBody } from '../models/sqsPayload';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../services/database';
import { addToSqs } from '../services/sqs';
import { NumberTypes, generateNewNumber } from '../services/testNumber';
import { StatusCode, VehicleType } from '../util/enum';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validatePlateErrors, validatePlateInfo } from '../validators/plate';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Plate end point called');

  const plateErrors = validatePlateErrors(event);
  if (plateErrors) {
    return addHttpHeaders(plateErrors);
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

  const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

  logger.debug(`result is: ${JSON.stringify(record)}`);

  if (!record || !Object.keys(record).length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  if (record.techRecord_statusCode !== StatusCode.CURRENT) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Tech record provided is not current',
    });
  }

  if (!(record.techRecord_vehicleType === VehicleType.HGV || record.techRecord_vehicleType === VehicleType.TRL)) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Tech record is not a HGV or TRL',
    });
  }

  const body = JSON.parse(event.body ?? '') as PlateRequestBody;

  const newPlate: Plates = {
    plateSerialNumber: await generateNewNumber(NumberTypes.PlateSerialNumber),
    plateIssueDate: new Date().toISOString(),
    plateReasonForIssue: body.reasonForCreation,
    plateIssuer: body.vtmUsername,
  };

  const plateInfoErrors = validatePlateInfo(newPlate);
  if (plateInfoErrors) {
    return addHttpHeaders(plateInfoErrors);
  }

  const arrayifiedRecord = formatTechRecord(record) as TechRecordHgv | TechRecordTrl;

  if (arrayifiedRecord.techRecord_plates) {
    arrayifiedRecord.techRecord_plates.push(newPlate);
  } else {
    arrayifiedRecord.techRecord_plates = [newPlate];
  }

  const normalisedRecord = await flattenArrays(arrayifiedRecord) as TechRecordGet;
  await inPlaceRecordUpdate(normalisedRecord);

  const plateSqsPayload: SQSRequestBody = {
    techRecord: arrayifiedRecord,
    plate: newPlate,
    documentName: DocumentName.MINISTRY,
    recipientEmailAddress: body.recipientEmailAddress,
  };

  logger.debug(JSON.stringify(plateSqsPayload));

  await addToSqs(plateSqsPayload, process.env.DOCUMENT_GEN_SQS ?? '');

  try {
    return addHttpHeaders({
      statusCode: 200,
      body: 'Plate generation successful',
    });
  } catch (err) {
    logger.error(`Error has been thrown with ${JSON.stringify(err)}`);
    return addHttpHeaders({ statusCode: 500, body: 'Error generating plate' });
  }
};
