import { VehicleConfiguration } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/vehicleConfigurationHgvPsv.enum.js';
import { TechRecordPUTHGV } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';
import { seedLocalTables, truncateLocalTables } from '../../../scripts';
import { REGEXES, post } from '../../util';

describe('post function', () => {
  beforeAll(async () => {
    await seedLocalTables();
  });

  describe('happy path', () => {
    it('should create a record, and return a 201 response with this record in its body', async () => {
      const response = await post<TechRecordPUTHGV>({
        vin: 'AA00AAA0AAAAAA',
        partialVin: 'AA00AA',
        techRecord_bodyType_description: 'description',
        techRecord_noOfAxles: 2,
        techRecord_reasonForCreation: 'testing post',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleClass_description: 'heavy goods vehicle',
        techRecord_vehicleConfiguration: VehicleConfiguration.ARTICULATED,
        techRecord_vehicleType: 'hgv',
      });

      expect(response.status).toBe(201);

      await expect(response.json()).resolves.toEqual(expect.objectContaining({
        systemNumber: expect.anything() as string,
        createdTimestamp: expect.stringMatching(REGEXES.timestamp) as string,
      }));
    }, 20000);
  });

  describe('unhappy path', () => {
    it('should return a 400 error response when the request body is malformed', async () => {
      const response = await post({});
      expect(response.status).toBe(400);
    }, 20000);

    it('should return a 400 error response when the request body is missing a vehicle type', async () => {
      const response = await post({
        vin: 'AA00AAA0AAAAAA',
        partialVin: 'AA00AA',
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual(expect.objectContaining({
        errors: ['"vehicleType" must be one of [hgv, psv, trl, lgv, car, motorcycle]'],
      }));
    }, 20000);

    it('should return a 400 error response when a vehicle type is provided, but is missing required fields for that type', async () => {
      const response = await post<TechRecordPUTHGV>({
        vin: 'AA00AAA0AAAAAA',
        partialVin: 'AA00AA',
        techRecord_bodyType_description: 'description',
        techRecord_noOfAxles: 2,
        techRecord_reasonForCreation: 'testing post',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleClass_description: 'heavy goods vehicle',
        techRecord_vehicleConfiguration: VehicleConfiguration.ARTICULATED,
        techRecord_vehicleType: undefined as unknown as 'hgv', // pretend vehicle has a vehicle type
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual(expect.objectContaining({
        errors: ['"vehicleType" must be one of [hgv, psv, trl, lgv, car, motorcycle]'],
      }));
    }, 20000);
  });

  afterAll(async () => {
    await truncateLocalTables();
  });
});
