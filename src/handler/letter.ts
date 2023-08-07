import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy';
import 'dotenv/config';
import { LetterRequestBody } from '../models/letter';
import {
  TechRecordTrl,
} from '../models/post';
import { getBySystemNumberAndCreatedTimestamp } from '../services/database';
import { StatusCode, VehicleType } from '../util/enum';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateLetterErrors } from '../validators/letter';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Letter end point called');

  const letterErrors = validateLetterErrors(event);
  if (letterErrors) {
    return addHttpHeaders(letterErrors);
  }

  const systemNumber: string = decodeURIComponent(event.pathParameters?.systemNumber as string);
  const createdTimestamp: string = decodeURIComponent(event.pathParameters?.createdTimestamp as string);
  logger.info(`Get from database with sysNum ${systemNumber} and timestamp ${createdTimestamp}`);

  const record = await getBySystemNumberAndCreatedTimestamp(systemNumber, createdTimestamp) as TechRecordTrl;

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

  if (record.techRecord_vehicleType !== VehicleType.TRL) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Tech record is not a TRL',
    });
  }

  const body = JSON.parse(event.body ?? '') as LetterRequestBody;

  record.techRecord_letterOfAuth_letterType = body.letterType;
  record.techRecord_letterOfAuth_paragraphId = body.paragraphId;
  record.techRecord_letterOfAuth_letterIssuer = body.vtmUsername;
  record.techRecord_letterOfAuth_letterDateRequested = new Date().toISOString();

  await inPlaceRecordUpdate(record as TechRecordGet);

  const letterSqsPayload: SQSRequestBody = {
    techRecord: formatTechRecord(record),
    letter: {
      letterType: record.techRecord_letterOfAuth_letterType,
      paragraphId: record.techRecord_letterOfAuth_paragraphId,
      letterIssuer: record.techRecord_letterOfAuth_letterIssuer,
      letterDateRequested: record.techRecord_letterOfAuth_letterDateRequested,
    },
    documentName: DocumentName.TRL_INTO_SERVICE,
    recipientEmailAddress: body.recipientEmailAddress,
  };

  await addToSqs(letterSqsPayload, process.env.DOCUMENT_GEN_SQS ?? '');

  try {
    return addHttpHeaders({
      statusCode: 200,
      body: 'LEtter generation successful',
    });
  } catch (err) {
    logger.error(`Error has been thrown with ${JSON.stringify(err)}`);
    return addHttpHeaders({ statusCode: 500, body: 'Error generating letter' });
  }
};
