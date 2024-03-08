import { TechRecordType as TechRecordTypeByVehicle } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { PlateRequestBody, Plates, TechRecordGETHGVOrTRL } from '../models/plate';
import { DocumentName, SQSRequestBody } from '../models/sqsPayload';
import { getBySystemNumberAndCreatedTimestamp, inPlaceRecordUpdate } from '../services/database';
import { addToSqs } from '../services/sqs';
import { flattenArrays, formatTechRecord } from '../util/formatTechRecord';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import {
  validatePlateInfo, validatePlateRecordErrors, validatePlateRequestBody, validateTechRecordPlates,
} from '../validators/plate';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Plate end point called');

  const plateRequestBodyErrors = validatePlateRequestBody(event);
  if (plateRequestBodyErrors) {
    return addHttpHeaders(plateRequestBodyErrors);
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

  const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp);

  logger.debug(`result is: ${JSON.stringify(record)}`);

  const plateRecordErrors = validatePlateRecordErrors(record as TechRecordGETHGVOrTRL, systemNumber, createdTimestamp);
  if (plateRecordErrors) {
    return plateRecordErrors;
  }

  const body = JSON.parse(event.body ?? '') as PlateRequestBody;

  const newPlate: Plates = {
    plateSerialNumber: uuidv4(),
    plateIssueDate: new Date().toISOString(),
    plateReasonForIssue: body.reasonForCreation,
    plateIssuer: body.vtmUsername,
  };

  const plateInfoErrors = validatePlateInfo(newPlate);
  if (plateInfoErrors) {
    return addHttpHeaders(plateInfoErrors);
  }

  const arrayifiedRecord = formatTechRecord<TechRecordTypeByVehicle<'hgv'> | TechRecordTypeByVehicle<'trl'>>(record);

  const validateVehicleFields = validateTechRecordPlates(arrayifiedRecord);
  if (validateVehicleFields) {
    return addHttpHeaders(validateVehicleFields);
  }

  if (arrayifiedRecord.techRecord_plates) {
    arrayifiedRecord.techRecord_plates.push(newPlate);
  } else {
    arrayifiedRecord.techRecord_plates = [newPlate];
  }

  const normalisedRecord = flattenArrays(arrayifiedRecord) as TechRecordType<'get'>;
  await inPlaceRecordUpdate(normalisedRecord);

  const plateSqsPayload: SQSRequestBody = {
    techRecord: arrayifiedRecord,
    plate: newPlate,
    documentName: DocumentName.MINISTRY,
    recipientEmailAddress: body.recipientEmailAddress,
  };

  logger.debug(JSON.stringify(plateSqsPayload));

  await addToSqs(plateSqsPayload, process.env.DOC_GEN_SQS_QUEUE ?? '');

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
