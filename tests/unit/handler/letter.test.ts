/* eslint-disable import/first */
const mockValidateLetterErrors = jest.fn();
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockInPlaceRecordUpdate = jest.fn();
const mockAddToSqs = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda/trigger/api-gateway-proxy';
import { handler } from '../../../src/handler/letter';
import { DocumentName } from '../../../src/models/sqsPayload';

const headers = { 'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT', 'Access-Control-Allow-Origin': '*' };
const payload = {
  letterType: 'trailer accept',
  paragraphId: '2',
  vtmUsername: 'test',
  recipientEmailAddress: 'n@n.com',
};
const mockedDate = new Date(2023, 1, 1);

jest.mock('../../../src/validators/letter.ts', () => ({
  validateLetterErrors: mockValidateLetterErrors,
}));

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  inPlaceRecordUpdate: mockInPlaceRecordUpdate,
}));

jest.mock('../../../src/services/sqs', () => ({
  addToSqs: mockAddToSqs,
}));

describe('Letter Gen Testing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
  });

  describe('Error handling', () => {
    it('should return an error if no letter type given', async () => {
      mockValidateLetterErrors.mockReturnValueOnce({ statusCode: 400, body: 'No letter type given' });
      const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ headers, statusCode: 400, body: 'No letter type given' });
    });

    it('should error if it does not find a record', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({});
      mockValidateLetterErrors.mockReturnValueOnce(undefined);
      const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({
        statusCode: 404,
        body: 'No record found matching systemNumber 123456 and timestamp 12345',
        headers,
      });
    });

    it('should error if the record is not current', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'provisional' });
      mockValidateLetterErrors.mockReturnValueOnce(undefined);
      const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({
        statusCode: 400,
        body: 'Tech record provided is not current',
        headers,
      });
    });

    it('should error if the record is not trl', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'current', techRecord_vehicleType: 'psv' });
      mockValidateLetterErrors.mockReturnValueOnce(undefined);
      const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' } } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({
        statusCode: 400,
        body: 'Tech record is not a TRL',
        headers,
      });
    });
  });

  describe('successful call', () => {
    it('should work when given correct info', async () => {
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({ techRecord_statusCode: 'current', techRecord_vehicleType: 'trl' });
      mockValidateLetterErrors.mockReturnValueOnce(undefined);
      process.env.AWS_SAM_LOCAL = 'true';

      const letter = {
        letterType: 'trailer accept',
        paragraphId: '2',
        letterIssuer: 'test',
        letterDateRequested: new Date().toISOString(),
      };

      const expectedSqsPayload = {
        techRecord: {
          techRecord_statusCode: 'current',
          techRecord_vehicleType: 'trl',
          techRecord_letterOfAuth_letterType: 'trailer accept',
          techRecord_letterOfAuth_paragraphId: '2',
          techRecord_letterOfAuth_letterIssuer: 'test',
          techRecord_letterOfAuth_letterDateRequested: new Date().toISOString(),
        },
        letter,
        documentName: DocumentName.TRL_INTO_SERVICE,
        recipientEmailAddress: 'n@n.com',
      };

      const res = await handler({ pathParameters: { systemNumber: '123456', createdTimestamp: '12345' }, body: JSON.stringify(payload) } as unknown as APIGatewayProxyEvent);
      expect(mockAddToSqs).toHaveBeenCalledWith(expectedSqsPayload, expect.anything());
      expect(res).toEqual({
        statusCode: 200,
        body: 'Letter generation successful',
        headers,
      });
    });
  });
});
