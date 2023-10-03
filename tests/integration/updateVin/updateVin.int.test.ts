import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { seedTables } from '../../../scripts/setup-local-tables';
import { tableName } from '../../../src/config';
import techRecordData from '../../resources/technical-records-v3.json';
import { mockToken } from '../../unit/util/mockToken';

describe('updateVin', () => {
  beforeEach(async () => {
    await seedTables([{
      table: tableName,
      data: techRecordData,
    }]);
  });
  describe('happy path', () => {
    it('should update a vin and archive the old record', async () => {
      jest.setTimeout(20000);
      const systemNumber = '11000162';
      const createdTimestamp = '2023-09-13T13:06:51.221Z';

      const response = await fetch(
        `http:/127.0.0.1:3000/v3/technical-records/updateVin/${systemNumber}/${createdTimestamp}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ newVin: '123456789' }),
          headers: {
            Authorization: mockToken,
          },
        },
      );

      const json = await response.json() as TechRecordType<'get'>;

      expect(json.vin).toBe('123456789');
      expect(json.techRecord_statusCode).toBe('provisional');

      const checkOldRecord = await fetch(
        `http:/127.0.0.1:3000/v3/technical-records/${systemNumber}/${createdTimestamp}`,
        {
          method: 'GET',
          headers: {
            Authorization: mockToken,
          },
        },
      );

      const jsonOldRecord = await checkOldRecord.json() as TechRecordType<'get'>;

      console.log(jsonOldRecord);

      expect(jsonOldRecord.vin).not.toBe('123456789');
      expect(jsonOldRecord.techRecord_statusCode).toBe('archived');
    });
  });

  describe('unhappy path', () => {
    it('should error if the record is already archived', async () => {
      const systemNumber = '8AJWFM00066';
      const createdTimestamp = '2019-06-15T10:36:12.903Z';

      const response = await fetch(
        `http:/127.0.0.1:3000/v3/technical-records/updateVin/${systemNumber}/${createdTimestamp}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ newVin: '123456789' }),
          headers: {
            Authorization: mockToken,
          },
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await response.json();

      expect(json).toEqual({ errors: 'Cannot update an archived record' });
      expect(response.status).toBe(400);
    });
  });

  it('should error if the record is already archived', async () => {
    const systemNumber = '11100136';
    const createdTimestamp = '2023-09-20T15:56:43.608Z';

    const response = await fetch(
      `http:/127.0.0.1:3000/v3/technical-records/updateVin/${systemNumber}/${createdTimestamp}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newVin: 'OIQ123' }),
        headers: {
          Authorization: mockToken,
        },
      },
    );

    const json = await response.json() as TechRecordType<'get'>;

    expect(json).toEqual({ errors: 'New VIN is invalid' });
  });
});
