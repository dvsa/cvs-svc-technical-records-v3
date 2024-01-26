/* eslint-disable import/first */
const mockValidateAdrCertificate = jest.fn();
const mockValidateAdrCertificateDetails = jest.fn();
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockInPlaceRecordUpdate = jest.fn();
const mockAddToSqs = jest.fn();
const mockGetUserDetails = jest.fn();

import { ADRCertificateTypes } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/adrCertificateTypes.enum.js';
import { APIGatewayProxyEvent } from 'aws-lambda/trigger/api-gateway-proxy';
import { handler } from '../../../src/handler/adrCertificate';
import { HgvOrTrl } from '../../../src/models/plateRequiredFields';
import { DocumentName } from '../../../src/models/sqsPayload';
import { formatTechRecord } from '../../../src/util/formatTechRecord';
import hgvTechRecord from '../../resources/techRecordCompleteHGVPlate.json';

jest.mock('../../../src/validators/adrCertificate', () => ({
  validateAdrCertificate: mockValidateAdrCertificate,
  validateAdrCertificateDetails: mockValidateAdrCertificateDetails,
}));

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  inPlaceRecordUpdate: mockInPlaceRecordUpdate,
}));

jest.mock('../../../src/services/sqs', () => ({
  addToSqs: mockAddToSqs,
}));

jest.mock('../../../src/services/user', () => ({
  getUserDetails: mockGetUserDetails,
}));

const headers = {
  'Access-Control-Allow-Headers':
  'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Origin': '*',
};
const payload = {
  certificateType: 'PASS',
};
const mockedDate = new Date(2023, 1, 1);

describe('Test adr cert gen lambda', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
  });

  describe('Error handling', () => {
    it('should return an error when no certificate type', async () => {
      mockValidateAdrCertificate.mockReturnValueOnce({ statusCode: 400, body: 'Certificate type not provided' });
      mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });
      const res = await handler({
        pathParameters: {
          systemNumber: '123456',
          createdTimestamp: mockedDate.toISOString(),

        },
        body: JSON.stringify({ foo: 'bar' }),
      } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Certificate type not provided', headers });
    });
  });

  it('should error if it does not find a record', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({});
    mockValidateAdrCertificate.mockReturnValueOnce(undefined);
    mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

    const res = await handler({
      pathParameters: {
        systemNumber: '123456',
        createdTimestamp: mockedDate.toISOString(),
      },
    } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 404,
      body: `No record found matching systemNumber 123456 and timestamp ${mockedDate.toISOString()}`,
      headers,
    });
  });

  it('should error if the record is archived', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'archived' });
    mockValidateAdrCertificate.mockReturnValueOnce(undefined);
    mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

    const res = await handler({
      pathParameters: {
        systemNumber: '123456',
        createdTimestamp: mockedDate.toISOString(),
      },
    } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Tech record cannot be archived',
      headers,
    });
  });

  it('should error if the record is not hgv or trl or lgv', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'current', techRecord_vehicleType: 'psv' });
    mockValidateAdrCertificate.mockReturnValueOnce(undefined);
    mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

    const res = await handler({
      pathParameters: {
        systemNumber: '123456',
        createdTimestamp: mockedDate.toISOString(),
      },
    } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Tech record is not a HGV or TRL or LGV',
      headers,
    });
  });

  it('should error if the record is not allowed dangerous goods', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ ...hgvTechRecord, techRecord_adrDetails_dangerousGoods: false });
    mockValidateAdrCertificate.mockReturnValueOnce(undefined);
    mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

    const res = await handler({
      pathParameters: {
        systemNumber: '123456',
        createdTimestamp: mockedDate.toISOString(),
      },
    } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Tech record does not allow dangerous goods',
      headers,
    });
  });

  it('should error if the adr cert details is missing', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvTechRecord);
    mockValidateAdrCertificate.mockReturnValueOnce(undefined);
    mockValidateAdrCertificateDetails.mockReturnValueOnce({ statusCode: 500, body: 'Missing adr certificate information' });
    mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

    process.env.AWS_SAM_LOCAL = 'true';
    const res = await handler({
      pathParameters: { systemNumber: '123456', createdTimestamp: mockedDate.toISOString() },
      body: JSON.stringify(payload),
    } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 500,
      body: 'Missing adr certificate information',
      headers,
    });
  });

  describe('successful call', () => {
    it('should work when given correct info', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvTechRecord);
      mockValidateAdrCertificate.mockReturnValueOnce(undefined);
      mockValidateAdrCertificateDetails.mockReturnValueOnce(undefined);
      mockGetUserDetails.mockReturnValueOnce({ username: 'user', msOid: '123' });

      process.env.AWS_SAM_LOCAL = 'true';

      const adrCertificate = {
        createdByName: 'user',
        certificateType: payload.certificateType as ADRCertificateTypes,
        generatedTimestamp: new Date().toISOString(),
        certificateId: `adr_pass_10000102_${new Date().toISOString()}`,
      };
      const formattedRecord = formatTechRecord(hgvTechRecord);
      const expectedSqsPayload = {
        techRecord: { ...formattedRecord as HgvOrTrl, techRecord_adrPassCertificateDetails: [adrCertificate] },
        adrCertificate,
        documentName: DocumentName.ADR_PASS_CERTIFICATE,
        recipientEmailAddress: '',
      };

      const res = await handler({
        pathParameters: { systemNumber: '10000102', createdTimestamp: mockedDate.toISOString() },
        body: JSON.stringify(payload),
      } as unknown as APIGatewayProxyEvent);
      expect(mockAddToSqs).toHaveBeenCalledWith(expectedSqsPayload, expect.anything());
      expect(res).toEqual({
        statusCode: 200,
        body: JSON.stringify('ADR certificate generation successful'),
        headers,
      });
    });
  });
});
