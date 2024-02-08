import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { seedLocalTables, truncateLocalTables } from '../../../scripts';
import { REGEXES, patch } from '../../util';

describe('update function', () => {
  beforeAll(async () => {
    await seedLocalTables();
  });

  describe('happy path', () => {
    describe('given a full record', () => {
      it('should update the record', async () => {
        const systemNumber = '11000162';
        const createdTimestamp = '2023-09-13T13:06:51.221Z';

        const response = await patch(systemNumber, createdTimestamp, {
          systemNumber,
          createdTimestamp,
          partialVin: '123456',
          primaryVrm: '1100008Z',
          techRecord_alterationMarker: false,
          techRecord_applicantDetails_address1: 'New address', // changed property
          techRecord_applicantDetails_address2: 'Country Lane',
          techRecord_applicantDetails_address3: 'West Midlands',
          techRecord_applicantDetails_emailAddress: 'company@email.com',
          techRecord_applicantDetails_name: 'COMPANY NUMBER 1',
          techRecord_applicantDetails_postCode: 'B1 444',
          techRecord_applicantDetails_postTown: 'Birmingham',
          techRecord_applicantDetails_telephoneNumber: '0001111222200112', // changed property
          techRecord_approvalType: 'NSSTA',
          techRecord_approvalTypeNumber: '123123',
          techRecord_axles_0_axleNumber: 1,
          techRecord_axles_0_parkingBrakeMrk: false,
          techRecord_axles_0_tyres_dataTrAxles: 148,
          techRecord_axles_0_tyres_fitmentCode: 'double',
          techRecord_axles_0_tyres_plyRating: '',
          techRecord_axles_0_tyres_tyreCode: 450,
          techRecord_axles_0_tyres_tyreSize: '11/70-22.5',
          techRecord_axles_0_weights_designWeight: 123,
          techRecord_axles_0_weights_eecWeight: 123,
          techRecord_axles_0_weights_gbWeight: 123,
          techRecord_axles_1_axleNumber: 2,
          techRecord_axles_1_parkingBrakeMrk: false,
          techRecord_axles_1_tyres_dataTrAxles: 151,
          techRecord_axles_1_tyres_fitmentCode: 'single',
          techRecord_axles_1_tyres_plyRating: '',
          techRecord_axles_1_tyres_tyreCode: 450,
          techRecord_axles_1_tyres_tyreSize: '11/70-22.5',
          techRecord_axles_1_weights_designWeight: 123,
          techRecord_axles_1_weights_eecWeight: 456,
          techRecord_axles_1_weights_gbWeight: 123,
          techRecord_bodyType_code: 'c',
          techRecord_bodyType_description: 'refrigerated',
          techRecord_brakes_dtpNumber: '12445', // changed property
          techRecord_conversionRefNo: '123456',
          techRecord_createdAt: '2023-09-13T13:06:51.221Z',
          techRecord_createdById: '962f584f-a9b8-4b39-a9d2-60789e185f26',
          techRecord_createdByName: 'John Smith',
          techRecord_departmentalVehicleMarker: false,
          techRecord_dimensions_axleSpacing_0_axles: '1-2',
          techRecord_dimensions_axleSpacing_0_value: 123,
          techRecord_dimensions_length: 123,
          techRecord_dimensions_width: 123,
          techRecord_drawbarCouplingFitted: false,
          techRecord_emissionsLimit: 11,
          techRecord_euroStandard: 'Euro 4',
          techRecord_euVehicleCategory: 'n3',
          techRecord_frontAxleTo5thWheelMax: 123,
          techRecord_frontAxleTo5thWheelMin: 123,
          techRecord_frontAxleToRearAxle: 123,
          techRecord_frontVehicleTo5thWheelCouplingMax: 123,
          techRecord_frontVehicleTo5thWheelCouplingMin: 123,
          techRecord_fuelPropulsionSystem: 'Diesel',
          techRecord_functionCode: 'R',
          techRecord_grossDesignWeight: 123,
          techRecord_grossEecWeight: 123,
          techRecord_grossGbWeight: 123,
          techRecord_lastUpdatedAt: '2023-09-13T13:09:42.017Z',
          techRecord_lastUpdatedById: '962f584f-a9b8-4b39-a9d2-60789e185f26',
          techRecord_lastUpdatedByName: 'John Smith',
          techRecord_make: 'AVIA',
          techRecord_manufactureYear: 1995,
          techRecord_maxTrainDesignWeight: 231,
          techRecord_maxTrainEecWeight: 123,
          techRecord_maxTrainGbWeight: 213,
          techRecord_microfilm_microfilmDocumentType: 'Tempo 100 Sp Ord',
          techRecord_microfilm_microfilmRollNumber: '12345',
          techRecord_microfilm_microfilmSerialNumber: '1234',
          techRecord_model: 'Custom',
          techRecord_noOfAxles: 2,
          techRecord_notes: 'hgv record complete',
          techRecord_ntaNumber: '123',
          techRecord_offRoad: false,
          techRecord_reasonForCreation: 'hgv record',
          techRecord_recordCompleteness: 'complete',
          techRecord_regnDate: '1998-02-14',
          techRecord_roadFriendly: true,
          techRecord_speedLimiterMrk: false,
          techRecord_statusCode: 'provisional',
          techRecord_tachoExemptMrk: false,
          techRecord_trainDesignWeight: 123,
          techRecord_trainEecWeight: 123,
          techRecord_trainGbWeight: 123,
          techRecord_tyreUseCode: '2R',
          techRecord_variantNumber: '123',
          techRecord_variantVersionNumber: '123',
          techRecord_vehicleClass_code: 'v',
          techRecord_vehicleClass_description: 'heavy goods vehicle',
          techRecord_vehicleConfiguration: 'articulated',
          techRecord_vehicleType: 'hgv',
          vin: '123456',
        });

        expect(response.status).toBe(200);

        await expect(response.json()).resolves.toEqual(expect.objectContaining({
          systemNumber: '11000162',
          techRecord_applicantDetails_address1: 'New address',
          techRecord_applicantDetails_telephoneNumber: '0001111222200112',
          techRecord_brakes_dtpNumber: '12445',
          // TODO: expect the createdAtTimestamp to be recent
        }));
      }, 20000);
    });

    describe('given a partial record', () => {
      it('should update the record', async () => {
        const systemNumber = '1101234';
        const createdTimestamp = '2023-09-13T13:06:51.221Z';

        const response = await patch(systemNumber, createdTimestamp, {
          systemNumber,
          createdTimestamp,
          partialVin: '123456',
          primaryVrm: '1100008Z',
          techRecord_alterationMarker: true, // changed property
          techRecord_applicantDetails_address1: 'New address 2', // changed property
          techRecord_applicantDetails_address2: 'Country Lane 2', // changed property
        });

        expect(response.status).toBe(200);

        await expect(response.json()).resolves.toEqual(expect.objectContaining({
          systemNumber,
          techRecord_alterationMarker: true,
          techRecord_applicantDetails_address1: 'New address 2',
          techRecord_applicantDetails_address2: 'Country Lane 2',
          // TODO: expect the createdAtTimestamp to be recent
        }));
      }, 20000);

      it('should modify vehicleType (non-TRL -> TRL)', async () => {
        const systemNumber = '8AJWFM00066';
        const createdTimestamp = '2019-06-15T10:26:53.903Z';

        const response = await patch(systemNumber, createdTimestamp, {
          techRecord_applicantDetails_address1: '35 TRL Street',
          techRecord_reasonForCreation: 'update address',
          techRecord_vehicleType: 'trl',
          techRecord_vehicleClass_description: 'trailer',
          techRecord_euVehicleCategory: 'o3',
          techRecord_vehicleConfiguration: null,
          techRecord_bodyType_description: 'description',
        });

        expect(response.status).toBe(200);

        const json = await response.json() as TechRecordType<'get'>;

        expect(json).not.toHaveProperty('trailerId');

        expect(json).toEqual(expect.objectContaining({
          techRecord_vehicleType: 'trl',
          techRecord_createdById: '123123',
          techRecord_createdByName: 'John Doe',
          techRecord_vehicleClass_description: 'trailer',
          techRecord_euVehicleCategory: 'o3',
          techRecord_vehicleConfiguration: null,
          createdTimestamp: expect.stringMatching(REGEXES.timestamp) as string,
          techRecord_createdAt: expect.stringMatching(REGEXES.timestamp) as string,
        }));
      }, 20000);
    });
  });

  describe('unhappy path', () => {
    it('should return a 400 error response if the request body has a missing or malformed vehicle type', async () => {
      const response = await patch('XYZEP5JYOMM00020', '2019-06-19T10:26:54.903Z', {
        techRecord_vehicleType: 'invalid',
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ errors: ['Payload is invalid'] });
    }, 20000);

    it('should return a 400 error response if the request body has a valid vehicle type, but is missing required fields', async () => {
      const response = await patch('10000555', '2024-02-05T08:26:15.659Z', {
        techRecord_approvalType: 'invalid',
      });

      expect(response.status).toBe(400);

      await expect(response.json()).resolves.toEqual({
        errors: [
          'techRecord_approvalType must be equal to one of the allowed values',
          'techRecord_approvalType must be null',
          'techRecord_approvalType must match a schema in anyOf'],
      });
    }, 20000);
  });

  afterAll(async () => {
    await truncateLocalTables();
  });
});
