import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { seedTables } from '../../../scripts/setup-local-tables';
import { tableName } from '../../../src/config';
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
    describe('given a full record', () => {
      it('should update the record', async () => {
        const systemNumber = '11000162';
        const createdTimestamp = '2023-09-13T13:06:51.221Z';
        const recordToUpdate = techRecordData.find((record) => record.systemNumber === systemNumber
        && record.createdTimestamp === createdTimestamp);

        const updatedRecord = {
          ...recordToUpdate,
          techRecord_applicantDetails_address1: '35 HGV Street',
          techRecord_reasonForCreation: 'update address',
        };

        const expected = {
          ...formatTechRecord<Partial<TechRecordType<'get'>>>(updatedRecord),
          techRecord_createdById: '123123',
          techRecord_createdByName: 'John Doe',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdTimestamp: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          techRecord_createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
        };

        delete expected.techRecord_lastUpdatedAt;
        delete expected.techRecord_lastUpdatedById;
        delete expected.techRecord_lastUpdatedByName;

        const response = await fetch(
          `http:/127.0.0.1:3000/v3/technical-records/${systemNumber}/${createdTimestamp}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updatedRecord),
            headers: {
              Authorization: mockToken,
            },
          },
        );

        const json = await response.json() as TechRecordType<'get'>;

        expect(json).toEqual(expected);
        expect(response.status).toBe(200);
      });
    });

    describe('given a partial record', () => {
      it('should update the record', async () => {
        const systemNumber = '11000162';
        const createdTimestamp = '2023-09-13T13:06:51.221Z';
        const recordToUpdate = techRecordData.find((record) => record.systemNumber === systemNumber
        && record.createdTimestamp === createdTimestamp);

        const updatedRecord = {
          techRecord_applicantDetails_address1: '35 HGV Street',
          techRecord_reasonForCreation: 'update address',
        };

        const expected = {
          ...formatTechRecord<Partial<TechRecordType<'get'>>>({ ...recordToUpdate, ...updatedRecord }),
          techRecord_createdById: '123123',
          techRecord_createdByName: 'John Doe',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdTimestamp: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          techRecord_createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
        };

        delete expected.techRecord_lastUpdatedAt;
        delete expected.techRecord_lastUpdatedById;
        delete expected.techRecord_lastUpdatedByName;

        const response = await fetch(
          `http:/127.0.0.1:3000/v3/technical-records/${systemNumber}/${createdTimestamp}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updatedRecord),
            headers: {
              Authorization: mockToken,
            },
          },
        );

        const json = await response.json() as TechRecordType<'get'>;

        expect(json).toEqual(expected);
        expect(response.status).toBe(200);
      });
    });
  });

  describe('unhappy path', () => {
    it('should error if the vehicle type is invalid', async () => {
      const systemNumber = '11000162';
      const createdTimestamp = '2023-09-13T13:06:51.221Z';

      const response = await fetch(
        `http:/127.0.0.1:3000/v3/technical-records/${systemNumber}/${createdTimestamp}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ techRecord_vehicleType: 'invalid' }),
          headers: {
            Authorization: mockToken,
          },
        },
      );

      const json = await response.json() as TechRecordType<'get'>;

      expect(json).toEqual({ errors: ['Payload is invalid'] });
      expect(response.status).toBe(400);
    });

    it('should error if one of the fields is invalid', async () => {
      const systemNumber = '11000162';
      const createdTimestamp = '2023-09-13T13:06:51.221Z';

      const response = await fetch(
        `http:/127.0.0.1:3000/v3/technical-records/${systemNumber}/${createdTimestamp}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ techRecord_approvalType: 'invalid' }),
          headers: {
            Authorization: mockToken,
          },
        },
      );

      const json = await response.json() as TechRecordType<'get'>;

      expect(json).toEqual({
        errors: [
          'techRecord_approvalType must be equal to one of the allowed values',
          'techRecord_approvalType must be null',
          'techRecord_approvalType must match a schema in anyOf'],
      });
      expect(response.status).toBe(400);
    });
  });
});
