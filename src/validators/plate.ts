import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PlateRequestBody, Plates } from '../models/plate';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validatePlateErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  const isPathInvalid: APIGatewayProxyResult | undefined = validateSysNumTimestampPathParams(event);

  if (isPathInvalid) {
    return isPathInvalid;
  }

  if (!event.body || !Object.keys(event.body).length) {
    return {
      statusCode: 400,
      body: 'invalid request',
    };
  }

  const body = JSON.parse(event.body) as PlateRequestBody;

  if (!body.reasonForCreation) {
    return {
      statusCode: 400,
      body: 'Reason for creation not provided',
    };
  }

  if (!body.vtmUsername) {
    return {
      statusCode: 400,
      body: 'No username provided',
    };
  }

  if (!body.recipientEmailAddress) {
    return {
      statusCode: 400,
      body: 'No recipient email provided',
    };
  }

  return undefined;
};

export const validatePlateInfo = (plate: Plates): APIGatewayProxyResult | undefined => {
  if (!plate) {
    return {
      statusCode: 500,
      body: 'Missing plate information',
    };
  }

  if (!plate.plateSerialNumber) {
    return {
      statusCode: 500,
      body: 'Missing plate serial number',
    };
  }

  if (!plate.plateIssueDate) {
    return {
      statusCode: 500,
      body: 'Missing plate issue date',
    };
  }

  if (!plate.plateReasonForIssue) {
    return {
      statusCode: 500,
      body: 'Missing plate reason for issue',
    };
  }

  if (!plate.plateIssuer) {
    return {
      statusCode: 500,
      body: 'Missing plate issuer',
    };
  }

  return undefined;
};
