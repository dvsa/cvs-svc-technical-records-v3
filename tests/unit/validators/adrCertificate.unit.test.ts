/* eslint-disable import/first */
const mockValidateSysNumTimestampPathParams = jest.fn();

import { ADRCertificateDetails } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { validateAdrCertificate, validateAdrCertificateDetails } from '../../../src/validators/adrCertificate';

jest.mock('../../../src/validators/sysNumTimestamp', () => ({
  validateSysNumTimestampPathParams: mockValidateSysNumTimestampPathParams,
}));

describe('adrCertificateValidator', () => {
  describe('validateAdrCertificate', () => {
    it('should error if there is an error with system number of timestamp', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce({
        statusCode: 400,
        body: 'Missing system number',
      });
      const res = validateAdrCertificate({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Missing system number' });
    });
    it('should error if there is no body', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateAdrCertificate({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'invalid request' });
    });
    it('should error if there is no cert type', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateAdrCertificate({ body: JSON.stringify({ foo: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Certificate type not provided' });
    });
    it('should error if the cert type is wrong', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateAdrCertificate({ body: JSON.stringify({ certificateType: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Incorrect certificate type' });
    });
    it('should pass', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateAdrCertificate({ body: JSON.stringify({ certificateType: 'PASS' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toBeUndefined();
    });

    describe('validateAdrCertificateDetails', () => {
      it('should error if there is no cert', () => {
        const res = validateAdrCertificateDetails(undefined as unknown as ADRCertificateDetails);
        expect(res).toEqual({
          statusCode: 500,
          body: 'Missing adr certificate information',
        });
      });
      it('should error if there is no created by name', () => {
        const res = validateAdrCertificateDetails({ foo: 'bar' } as unknown as ADRCertificateDetails);
        expect(res).toEqual({
          statusCode: 500,
          body: 'Missing created by name information',
        });
      });
      it('should error if there is no type information', () => {
        const res = validateAdrCertificateDetails({ createdByName: 'Example Name' } as unknown as ADRCertificateDetails);
        expect(res).toEqual({
          statusCode: 500,
          body: 'Missing certificate type information',
        });
      });
      it('should error if the cert type is wrong', () => {
        const res = validateAdrCertificateDetails({ createdByName: 'Example Name', certificateType: 'food' } as unknown as ADRCertificateDetails);
        expect(res).toEqual({
          statusCode: 500,
          body: 'Incorrect certificate type information',
        });
      });
      it('should error if there is no cert ID =', () => {
        const res = validateAdrCertificateDetails({ createdByName: 'Example Name', certificateType: 'PASS' } as unknown as ADRCertificateDetails);
        expect(res).toEqual({
          statusCode: 500,
          body: 'Missing certificate id information',
        });
      });
      it('should error if there is no generated timestamp', () => {
        const res = validateAdrCertificateDetails({
          createdByName: 'Example Name',
          certificateType: 'PASS',
          certificateId: '12345',
        } as unknown as ADRCertificateDetails);
        expect(res).toEqual({
          statusCode: 500,
          body: 'Missing generated timestamp information',
        });
      });
      it('should not error', () => {
        const res = validateAdrCertificateDetails({
          createdByName: 'Example Name', certificateType: 'PASS', certificateId: '12345', generatedTimestamp: '12345',
        } as unknown as ADRCertificateDetails);
        expect(res).toBeUndefined();
      });
    });
  });
});
