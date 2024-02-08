import { chunk } from 'lodash';
import { seedTables } from '../../../../../scripts/setup-local-tables';
import { tableName } from '../../../../config';
import { getBySystemNumberAndCreatedTimestamp } from '../../../../services/database';
import { handler as removePrimaryVrm, InvalidPrimryVrmRecord } from '../../removeInvalidPrimaryVrms';
import techRecordData from './resources/technical-records-v3-invalid-primaryvrm.json';

describe('remove primary vrms function', () => {
  beforeAll(async () => {
    const techRecordChunks = chunk(techRecordData, 25);
    /* eslint-disable-next-line no-restricted-syntax */
    for (const techRecordChunk of techRecordChunks) {
      /* eslint-disable-next-line no-await-in-loop */
      await seedTables([{
        table: tableName,
        data: techRecordChunk,
      }]);
    }
  });

  describe('happy path', () => {
    it('should remove the primary vrm', async () => {
      /* eslint-disable-next-line global-require, @typescript-eslint/no-var-requires */
      const invalidVrms = require('../../resources/invalid-primary-vrms.json') as InvalidPrimryVrmRecord[];

      process.env.AWS_SAM_LOCAL = 'true';

      // Arrange

      // (would be better to DI a DateProvider, but this will do for now)
      const forceUpdateTimestamp = new Date();

      // Act
      const result = await removePrimaryVrm(invalidVrms, forceUpdateTimestamp);

      // Assert
      expect(result.statusCode).toBe(200);

      // Only n records should have been updated
      expect(result.body).toBe(`RPVRM: Updated ${invalidVrms.length} invalid tech records`);

      // Sanity check, ensure the primary vrm was falsified.
      /* eslint-disable-next-line no-restricted-syntax */
      for (const tr of invalidVrms) {
        // Verify the insertion
        const systemNumber = tr.system_number;
        const date = forceUpdateTimestamp.toISOString();

        /* eslint-disable-next-line no-await-in-loop */
        const updatedTechRecord = await getBySystemNumberAndCreatedTimestamp(systemNumber, date);

        expect('primaryVrm' in updatedTechRecord).toBeFalsy();

        // Verify the archive
        /* eslint-disable-next-line no-await-in-loop */
        const archivedTechRecord = await getBySystemNumberAndCreatedTimestamp(
          tr.system_number,
          new Date(tr.createdAt).toISOString(),
        );

        if (!('primaryVrm' in archivedTechRecord)) {
          throw Error('Primary VRM was not found on the tech record as expected');
        }
        expect(archivedTechRecord.primaryVrm).toEqual(tr.trailer_id);
        expect(archivedTechRecord.techRecord_statusCode).toBe('archived');
      }

      // There are records that should not have been updated, they all have the primary vrm value
      // UNAFFECTED_PRIMARY_VRMS.
      // Verify these weren't updated.
      const UNAFFECTED_PRIMARY_VRMS = 'PRIMARYVRM';

      /* eslint-disable-next-line no-restricted-syntax */
      for (const unaffectedRecord of techRecordData.filter((tr) => tr.primaryVrm === UNAFFECTED_PRIMARY_VRMS)) {
        const { systemNumber } = unaffectedRecord;
        const date = unaffectedRecord.createdTimestamp;

        /* eslint-disable-next-line no-await-in-loop */
        const techReord = await getBySystemNumberAndCreatedTimestamp(systemNumber, date);

        expect('primaryVrm' in techReord).toBeTruthy();
        if (!('primaryVrm' in techReord)) {
          throw Error('Primary VRM was not found on the tech record as expected');
        }

        expect(techReord.primaryVrm).toEqual(UNAFFECTED_PRIMARY_VRMS);
      }
    });
  });

  describe('unhappy path', () => {
    it('should update 0 if vehicle type is wrong', async () => {
      const invalidVrms = [{
        id: '12345',
        system_number: 'SNINVALIDCLASS',
        vin: '1234567890',
        vrm_trm: 'VRM_TRM',
        trailer_id: 'TRAILER_ID',
        createdAt: '2024-01-08 09:14:36.351',
      }];

      const result = await removePrimaryVrm(invalidVrms);
      expect(result.body).toBe('RPVRM: Updated 0 invalid tech records');
    });

    it('should update 0 if vrm is missing', async () => {
      const invalidVrms = [{
        id: '12345',
        system_number: 'SNINVALIDVRM',
        vin: '1234567890',
        vrm_trm: 'VRM_TRM',
        trailer_id: 'TRAILER_ID',
        createdAt: '2024-01-08 09:14:36.351',
      }];

      const result = await removePrimaryVrm(invalidVrms);
      expect(result.body).toBe('RPVRM: Updated 0 invalid tech records');
    });
  });
});
