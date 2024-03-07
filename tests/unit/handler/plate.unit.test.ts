/* eslint-disable import/first */
const mockValidatePlateErrors = jest.fn();
const mockValidatePlateInfo = jest.fn();
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockInPlaceRecordUpdate = jest.fn();
const mockAddToSqs = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda/trigger/api-gateway-proxy';
import { handler } from '../../../src/handler/plate';
import { HgvOrTrl } from '../../../src/models/plateRequiredFields';
import { DocumentName } from '../../../src/models/sqsPayload';
import { formatTechRecord } from '../../../src/util/formatTechRecord';
import hgvTechRecord from '../../resources/techRecordCompleteHGVPlate.json';
import incompleteHgvTechRecord from '../../resources/techRecordIncompleteHGVPlate.json';

jest.mock('../../../src/validators/plate', () => ({
  validatePlateErrors: mockValidatePlateErrors,
  validatePlateInfo: mockValidatePlateInfo,
}));

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  inPlaceRecordUpdate: mockInPlaceRecordUpdate,
}));

jest.mock('../../../src/services/sqs', () => ({
  addToSqs: mockAddToSqs,
}));

jest.mock('uuid', () => ({ v4: () => '123' }));

const headers = {
  'Access-Control-Allow-Headers':
  'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Origin': '*',
};
const payload = {
  reasonForCreation: 'plate',
  vtmUsername: 'test',
  recipientEmailAddress: 'n@n.com',
};
const mockedDate = new Date(2023, 1, 1);

describe('Test plate gen lambda', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
  });

  describe('Error handling', () => {
    it('should return an error when no reason for creation', async () => {
      mockValidatePlateErrors.mockReturnValueOnce({ statusCode: 400, body: 'Reason for creation not provided' });
      const res = await handler({ pathParameters: { foo: 'undefined' } } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Reason for creation not provided', headers });
    });
  });

  it('should error if it does not find a record', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({});
    mockValidatePlateErrors.mockReturnValueOnce(undefined);
    const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 404,
      body: 'No record found matching systemNumber 123456 and timestamp 12345',
      headers,
    });
  });

  it('should error if the record is not current', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'provisional' });
    mockValidatePlateErrors.mockReturnValueOnce(undefined);
    const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Tech record provided is not current',
      headers,
    });
  });

  it('should error if the record is not hgv or trl', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'current', techRecord_vehicleType: 'psv' });
    mockValidatePlateErrors.mockReturnValueOnce(undefined);
    const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Tech record is not a HGV or TRL',
      headers,
    });
  });

  it('should error if the plate info is missing', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvTechRecord);
    mockValidatePlateErrors.mockReturnValueOnce(undefined);
    mockValidatePlateInfo.mockReturnValueOnce({ statusCode: 500, body: 'Missing plate information' });
    process.env.AWS_SAM_LOCAL = 'true';
    const res = await handler({
      pathParameters: { systemNumber: '123456', createdTimestamp: '12345' },
      body: JSON.stringify(payload),
    } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 500,
      body: 'Missing plate information',
      headers,
    });
  });

  it('should error if the vehicle does not meet the validation requirements', async () => {
    mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(incompleteHgvTechRecord);
    mockValidatePlateErrors.mockReturnValueOnce(undefined);
    mockValidatePlateInfo.mockReturnValueOnce(undefined);
    process.env.AWS_SAM_LOCAL = 'true';
    const res = await handler({
      pathParameters: { systemNumber: '123456', createdTimestamp: '12345' },
      body: JSON.stringify(payload),
    } as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Tech record is missing mandatory fields for a plate',
      headers,
    });
  });

  describe('successful call', () => {
    it('should work when given correct info', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvTechRecord);
      mockValidatePlateErrors.mockReturnValueOnce(undefined);
      mockValidatePlateInfo.mockReturnValueOnce(undefined);
      process.env.AWS_SAM_LOCAL = 'true';

      const plate = {
        plateSerialNumber: '123',
        plateIssueDate: new Date().toISOString(),
        plateReasonForIssue: 'plate',
        plateIssuer: 'test',
      };
      const formattedRecord = formatTechRecord(hgvTechRecord);
      const expectedSqsPayload = {
        techRecord: { ...formattedRecord as HgvOrTrl, techRecord_plates: [plate] },
        plate,
        documentName: DocumentName.MINISTRY,
        recipientEmailAddress: payload.recipientEmailAddress,
      };

      const res = await handler({
        pathParameters: { systemNumber: '10000102', createdTimestamp: '12345' },
        body: JSON.stringify(payload),
      } as unknown as APIGatewayProxyEvent);
      expect(mockAddToSqs).toHaveBeenCalledWith(expectedSqsPayload, expect.anything());
      expect(res).toEqual({
        statusCode: 200,
        body: 'Plate generation successful',
        headers,
      });
    });
  });
});
