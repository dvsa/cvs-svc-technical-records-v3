/* eslint-disable import/first */
const mockValidateSysNumTimestampPathParams = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PlateReasonForIssue, Plates } from '../../../src/models/plate';
import { validatePlateErrors, validatePlateInfo } from '../../../src/validators/plate';

jest.mock('../../../src/validators/sysNumTimestamp', () => ({
  validateSysNumTimestampPathParams: mockValidateSysNumTimestampPathParams,
}));

describe('Test plate validator', () => {
  describe('validatePlateErrors', () => {
    it('should error if there is an error with systemNumber or createdTimestamp', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce({
        statusCode: 400,
        body: 'Missing system number',
      });
      const res = validatePlateErrors({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Missing system number' });
    });

    it('should error if there is an empty body', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateErrors({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'invalid request' });
    });

    it('should error if there is no reason for creation', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateErrors({ body: JSON.stringify({ foo: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Reason for creation not provided' });
    });

    it('should error if there is no vtmUsername', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateErrors({ body: JSON.stringify({ reasonForCreation: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'No username provided' });
    });

    it('should error if there is no recipientEmailAddress', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateErrors({ body: JSON.stringify({ reasonForCreation: 'bar', vtmUsername: 'foo' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'No recipient email provided' });
    });

    it('should pass and return undefined', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateErrors({
        body: JSON.stringify({
          reasonForCreation: 'bar',
          vtmUsername: 'foo',
          recipientEmailAddress: 'n@n.com',
        }),
      } as unknown as APIGatewayProxyEvent);
      expect(res).toBeUndefined();
    });
  });
  describe('validatePlateInfo', () => {
    it('should error if no plate passed', () => {
      const res = validatePlateInfo(undefined as unknown as Plates);
      expect(res).toEqual({
        statusCode: 500,
        body: 'Missing plate information',
      });
    });

    it('should error if there is no serial number', () => {
      const res = validatePlateInfo({ plateIssueDate: 'bar' });
      expect(res).toEqual({
        statusCode: 500,
        body: 'Missing plate serial number',
      });
    });

    it('should error if there is issue date', () => {
      const res = validatePlateInfo({ plateSerialNumber: 'bar' });
      expect(res).toEqual({
        statusCode: 500,
        body: 'Missing plate issue date',
      });
    });

    it('should error if there is no reason for issue', () => {
      const res = validatePlateInfo({ plateSerialNumber: 'bar', plateIssueDate: 'bar' });
      expect(res).toEqual({
        statusCode: 500,
        body: 'Missing plate reason for issue',
      });
    });

    it('should error if there is no plate issuer', () => {
      const res = validatePlateInfo({ plateSerialNumber: 'bar', plateIssueDate: 'bar', plateReasonForIssue: PlateReasonForIssue.FREE_REPLACEMENT });
      expect(res).toEqual({
        statusCode: 500,
        body: 'Missing plate issuer',
      });
    });

    it('should return undefined when correct', () => {
      const res = validatePlateInfo({
        plateSerialNumber: 'bar', plateIssueDate: 'bar', plateReasonForIssue: PlateReasonForIssue.FREE_REPLACEMENT, plateIssuer: 'test',
      });
      expect(res).toBeUndefined();
    });
  });
});
