/* eslint-disable import/first */
const mockValidateSysNumTimestampPathParams = jest.fn();

import { VehicleConfiguration } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/vehicleConfigurationHgvPsv.enum.js';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-vehicle-type';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { PlateReasonForIssue, Plates } from '../../../src/models/plate';
import { hgvRequiredFields } from '../../../src/models/plateRequiredFields';
import { cannotGeneratePlate, validatePlateInfo, validatePlateRequestBody } from '../../../src/validators/plate';

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
      const res = validatePlateRequestBody({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Missing system number' });
    });

    it('should error if there is an empty body', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateRequestBody({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'invalid request' });
    });

    it('should error if there is no reason for creation', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateRequestBody({ body: JSON.stringify({ foo: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Reason for creation not provided' });
    });

    it('should error if there is no vtmUsername', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateRequestBody({ body: JSON.stringify({ reasonForCreation: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'No username provided' });
    });

    it('should error if there is no recipientEmailAddress', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateRequestBody(
        { body: JSON.stringify({ reasonForCreation: 'bar', vtmUsername: 'foo' }) } as unknown as APIGatewayProxyEvent,
      );
      expect(res).toEqual({ statusCode: 400, body: 'No recipient email provided' });
    });

    it('should pass and return undefined', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validatePlateRequestBody({
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

  describe('cannotGeneratePlate', () => {
    it('should not generate if a load/plyRating', () => {
      const techRecord = {
        primaryVrm: 'thing',
        vin: 'thing',
        techRecord_brakes_dtpNumber: 'thing',
        techRecord_regnDate: 'thing',
        techRecord_manufactureYear: 1,
        techRecord_speedLimiterMrk: true,
        techRecord_variantNumber: 'thing',
        techRecord_make: 'thing',
        techRecord_model: 'thing',
        techRecord_functionCode: 'thing',
        techRecord_frontVehicleTo5thWheelCouplingMin: 1,
        techRecord_frontVehicleTo5thWheelCouplingMax: 1,
        techRecord_dimensions_length: 1,
        techRecord_dimensions_width: 1,
        techRecord_tyreUseCode: '2R',
        techRecord_roadFriendly: true,
        techRecord_vehicleConfiguration: VehicleConfiguration.ARTICULATED,
        techRecord_axles: [{
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', weights_gbWeight: '123',
        },
        {
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', weights_gbWeight: '123',
        }],
        techRecord_noOfAxles: 2,
      } as unknown as TechRecordType<'hgv'>;
      const res = cannotGeneratePlate(hgvRequiredFields, techRecord);
      expect(res).toBeTruthy();
    });
    it('should not generate if missing axles', () => {
      const techRecord = {
        primaryVrm: 'thing',
        vin: 'thing',
        techRecord_brakes_dtpNumber: 'thing',
        techRecord_regnDate: 'thing',
        techRecord_manufactureYear: 1,
        techRecord_speedLimiterMrk: true,
        techRecord_variantNumber: 'thing',
        techRecord_make: 'thing',
        techRecord_model: 'thing',
        techRecord_functionCode: 'thing',
        techRecord_frontVehicleTo5thWheelCouplingMin: 1,
        techRecord_frontVehicleTo5thWheelCouplingMax: 1,
        techRecord_dimensions_length: 1,
        techRecord_dimensions_width: 1,
        techRecord_tyreUseCode: '2R',
        techRecord_roadFriendly: true,
        techRecord_vehicleConfiguration: VehicleConfiguration.ARTICULATED,
        techRecord_axles: [],
        techRecord_noOfAxles: 0,
      } as unknown as TechRecordType<'hgv'>;
      const res = cannotGeneratePlate(hgvRequiredFields, techRecord);
      expect(res).toBeTruthy();
    });
    it('should not generate without gbWeight on axle 1', () => {
      const techRecord = {
        primaryVrm: 'thing',
        vin: 'thing',
        techRecord_brakes_dtpNumber: 'thing',
        techRecord_regnDate: 'thing',
        techRecord_manufactureYear: 1,
        techRecord_speedLimiterMrk: true,
        techRecord_variantNumber: 'thing',
        techRecord_make: 'thing',
        techRecord_model: 'thing',
        techRecord_functionCode: 'thing',
        techRecord_frontVehicleTo5thWheelCouplingMin: 1,
        techRecord_frontVehicleTo5thWheelCouplingMax: 1,
        techRecord_dimensions_length: 1,
        techRecord_dimensions_width: 1,
        techRecord_tyreUseCode: '2R',
        techRecord_roadFriendly: true,
        techRecord_vehicleConfiguration: VehicleConfiguration.ARTICULATED,
        techRecord_axles: [{
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', tyres_plyRating: '2R',
        },
        {
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', tyres_plyRating: '2R',
        }],
        techRecord_noOfAxles: 2,
      } as unknown as TechRecordType<'hgv'>;
      const res = cannotGeneratePlate(hgvRequiredFields, techRecord);
      expect(res).toBeTruthy();
    });
    it('should not generate with a missing required hgv validation field', () => {
      const techRecord = {
        primaryVrm: 'thing',
        vin: 'thing',
        techRecord_brakes_dtpNumber: 'thing',
        techRecord_regnDate: 'thing',
        techRecord_manufactureYear: 1,
        techRecord_speedLimiterMrk: true,
        techRecord_variantNumber: 'thing',
        techRecord_model: 'thing',
        techRecord_functionCode: 'thing',
        techRecord_frontVehicleTo5thWheelCouplingMin: 1,
        techRecord_frontVehicleTo5thWheelCouplingMax: 1,
        techRecord_dimensions_length: 1,
        techRecord_dimensions_width: 1,
        techRecord_tyreUseCode: '2R',
        techRecord_roadFriendly: true,
        techRecord_vehicleConfiguration: VehicleConfiguration.ARTICULATED,
        techRecord_axles: [{
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', weights_gbWeight: '123', tyres_plyRating: '2R',
        },
        {
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', weights_gbWeight: '123', tyres_plyRating: '2R',
        }],
        techRecord_noOfAxles: 2,
      } as unknown as TechRecordType<'hgv'>;
      const res = cannotGeneratePlate(hgvRequiredFields, techRecord);
      expect(res).toBeTruthy();
    });
    it('should generate with a hgv plate', () => {
      const techRecord = {
        primaryVrm: 'thing',
        vin: 'thing',
        techRecord_brakes_dtpNumber: 'thing',
        techRecord_regnDate: 'thing',
        techRecord_manufactureYear: 1,
        techRecord_speedLimiterMrk: true,
        techRecord_variantNumber: 'thing',
        techRecord_make: 'thing',
        techRecord_model: 'thing',
        techRecord_functionCode: 'thing',
        techRecord_frontVehicleTo5thWheelCouplingMin: 1,
        techRecord_frontVehicleTo5thWheelCouplingMax: 1,
        techRecord_dimensions_length: 1,
        techRecord_dimensions_width: 1,
        techRecord_tyreUseCode: '2R',
        techRecord_roadFriendly: true,
        techRecord_vehicleConfiguration: VehicleConfiguration.ARTICULATED,
        techRecord_axles: [{
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', weights_gbWeight: '123', tyres_plyRating: '2R',
        },
        {
          tyres_fitmentCode: 'single', tyres_tyreSize: '215/25', weights_gbWeight: '123', tyres_plyRating: '2R',
        }],
        techRecord_noOfAxles: 2,
      } as unknown as TechRecordType<'hgv'>;
      const res = cannotGeneratePlate(hgvRequiredFields, techRecord);
      expect(res).toBeFalsy();
    });
  });
});
