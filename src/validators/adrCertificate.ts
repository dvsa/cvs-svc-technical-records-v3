import { ADRCertificateTypes } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/adrCertificateTypes.enum.js';
import { ADRCertificateDetails } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AdrCertificateDetailsPayload } from '../models/adrCertificateDetails';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validateAdrCertificate = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
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
  const body = JSON.parse(event.body) as AdrCertificateDetailsPayload;

  if (!body.certificateType) {
    return {
      statusCode: 400,
      body: 'Certificate type not provided',
    };
  }

  if (body.certificateType !== ADRCertificateTypes.PASS && body.certificateType !== ADRCertificateTypes.REPLACEMENT) {
    return {
      statusCode: 400,
      body: 'Incorrect certificate type',
    };
  }

  return undefined;
};

export const validateAdrCertificateDetails = (adrCert: ADRCertificateDetails): APIGatewayProxyResult | undefined => {
  if (!adrCert) {
    return {
      statusCode: 500,
      body: 'Missing adr certificate information',
    };
  }

  if (!adrCert.createdByName) {
    return {
      statusCode: 500,
      body: 'Missing created by name information',
    };
  }

  if (!adrCert.certificateType) {
    return {
      statusCode: 500,
      body: 'Missing certificate type information',
    };
  }

  if (adrCert.certificateType !== ADRCertificateTypes.PASS && adrCert.certificateType !== ADRCertificateTypes.REPLACEMENT) {
    return {
      statusCode: 500,
      body: 'Incorrect certificate type information',
    };
  }

  if (!adrCert.certificateId) {
    return {
      statusCode: 500,
      body: 'Missing certificate id information',
    };
  }

  if (!adrCert.generatedTimestamp) {
    return {
      statusCode: 500,
      body: 'Missing generated timestamp information',
    };
  }

  return undefined;
};
