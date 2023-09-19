import psvSchema from '@dvsa/cvs-type-definitions/json-schemas/v3/tech-record/put/psv/skeleton/index.json';
import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { seedTables } from '../../../scripts/setup-local-tables';
import { tableName } from '../../../src/config';
import { ERRORS } from '../../../src/util/enum';
import { formatTechRecord } from '../../../src/util/formatTechRecord';
import techRecordData from '../../resources/technical-records-v3.json';
import { mockToken } from '../../unit/util/mockToken';

describe('update function', () => {
  beforeEach(async () => {
    await seedTables([{
      table: tableName,
      data: techRecordData,
    }]);
  });
  describe('happy path', () => {
    it('should create the record', async () => {
      const systemNumber = '11000162';
      const createdTimestamp = '2023-09-13T13:06:51.221Z';
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const recordToCreate = techRecordData.find((record) => record.systemNumber === systemNumber
        && record.createdTimestamp === createdTimestamp)!;

      const expected = {
        ...formatTechRecord<Partial<TechRecordType<'get'>>>(recordToCreate),
        techRecord_createdById: '123123',
        techRecord_createdByName: 'John Doe',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdTimestamp: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        techRecord_createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        systemNumber: expect.anything(),
      };

      delete expected.techRecord_lastUpdatedAt;
      delete expected.techRecord_lastUpdatedById;
      delete expected.techRecord_lastUpdatedByName;

      const response = await fetch(
        'http:/127.0.0.1:3000/v3/technical-records',
        {
          method: 'POST',
          body: JSON.stringify(formatTechRecord(recordToCreate)),
          headers: {
            Authorization: mockToken,
          },
        },
      );

      const json = await response.json() as TechRecordType<'get'>;

      expect(json).toEqual(expected);
      expect(response.status).toBe(201);
    });
  });

  describe('unhappy path', () => {
    it('should return an error message if vehicle type is missing', async () => {
      const response = await fetch(
        'http:/127.0.0.1:3000/v3/technical-records',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            Authorization: mockToken,
          },
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await response.json();

      expect(json).toEqual({ errors: [ERRORS.VEHICLE_TYPE_ERROR] });
      expect(response.status).toBe(400);
    });

    it('should return the required fields to create if the body does not have them', async () => {
      const body = { techRecord_vehicleType: 'psv' };
      const response = await fetch(
        'http:/127.0.0.1:3000/v3/technical-records',
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            Authorization: mockToken,
          },
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await response.json();

      const requiredFields = psvSchema.required
        .filter((field) => !Object.keys(body).includes(field))
        .map((field: string) => `must have required property '${field}'`);

      expect(json).toEqual({ errors: requiredFields });
      expect(response.status).toBe(400);
    });
  });
});
