import { chunk } from 'lodash';
import { seedTables } from '../../../../../scripts/setup-local-tables';
import { tableName } from '../../../../config';
import { getBySystemNumberAndCreatedTimestamp } from '../../../../services/database';
import logger from '../../../../util/logger';
import { handler } from '../../batchPlateCreation';
import event from '../resources/event.json';
import techRecordData from '../resources/technical-records-v3-no-plates.json';

const batchIssuerName = 'CVS Batch Plate Generation';

describe('batch plate creation', () => {
  beforeAll(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date());

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
    it('should work when I give it a payload of plates to fix', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      const res = await handler(event);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(`Batch Plate: Updated ${event.length} tech records and added ${event.length} to sqs`);

      const inspectPlateOne = await getBySystemNumberAndCreatedTimestamp(
        event[0].systemNumber,
        event[0].createdTimestamp,
      );
      const inspectPlateThree = await getBySystemNumberAndCreatedTimestamp(
        event[2].systemNumber,
        event[2].createdTimestamp,
      );

      expect(inspectPlateOne).toEqual(expect.objectContaining({ techRecord_plates_0_plateIssuer: batchIssuerName }));
      expect(inspectPlateThree).toEqual(expect.objectContaining({ techRecord_plates_0_plateIssuer: batchIssuerName }));
    });
  });

  describe('sad path', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should only complete 1 of two updates if it cant find a vehicle', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      const inputEvent = [
        { systemNumber: 'bad', createdTimestamp: 'data' },
        { systemNumber: '12345690', createdTimestamp: '2024-01-30T09:10:32.594Z' },
      ];

      const spy = jest.spyOn(logger, 'error');

      const res = await handler(inputEvent);

      expect(spy).toHaveBeenCalledWith(
        `Missing record with sysNum ${inputEvent[0].systemNumber} and timestamp ${inputEvent[0].createdTimestamp}`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(`Batch Plate: Updated ${inputEvent.length - 1} tech records and added ${inputEvent.length - 1} to sqs`);

      const inspectPlateOne = await getBySystemNumberAndCreatedTimestamp(
        inputEvent[0].systemNumber,
        inputEvent[0].createdTimestamp,
      );
      const inspectPlateTwo = await getBySystemNumberAndCreatedTimestamp(
        inputEvent[1].systemNumber,
        inputEvent[1].createdTimestamp,
      );

      expect(inspectPlateOne).not.toHaveProperty('techRecord_plates_0_plateIssuer');
      expect(inspectPlateTwo).toEqual(expect.objectContaining({ techRecord_plates_0_plateIssuer: batchIssuerName }));
    });

    it('should only complete 1 of two updates if the record isnt current', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      const inputEvent = [
        { systemNumber: '12345688', createdTimestamp: '2024-01-31T15:18:53.501Z' },
        { systemNumber: '12345691', createdTimestamp: '2024-01-30T09:01:10.851Z' },
      ];

      const spy = jest.spyOn(logger, 'error');

      const res = await handler(inputEvent);

      expect(spy).toHaveBeenCalledWith(
        `Non current record with sysNum ${inputEvent[0].systemNumber} and timestamp ${inputEvent[0].createdTimestamp}`,
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(`Batch Plate: Updated ${inputEvent.length - 1} tech records and added ${inputEvent.length - 1} to sqs`);

      const inspectPlateOne = await getBySystemNumberAndCreatedTimestamp(
        inputEvent[0].systemNumber,
        inputEvent[0].createdTimestamp,
      );
      const inspectPlateTwo = await getBySystemNumberAndCreatedTimestamp(
        inputEvent[1].systemNumber,
        inputEvent[1].createdTimestamp,
      );

      expect(inspectPlateOne).not.toHaveProperty('techRecord_plates_0_plateIssuer');
      expect(inspectPlateTwo).toEqual(expect.objectContaining({ techRecord_plates_0_plateIssuer: batchIssuerName }));
    });

    it('should only complete 1 of two updates if the record isnt a trl or hgv', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      const inputEvent = [
        { systemNumber: 'SNINVALIDCLASS', createdTimestamp: '2024-01-08T09:14:36.351Z' },
        { systemNumber: '12345692', createdTimestamp: '2024-01-29T14:57:30.871Z' },
      ];

      const spy = jest.spyOn(logger, 'error');

      const res = await handler(inputEvent);

      expect(spy).toHaveBeenCalledWith(
        `Non trl or hgv record with sysNum ${inputEvent[0].systemNumber} and timestamp ${inputEvent[0].createdTimestamp}`,
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(`Batch Plate: Updated ${inputEvent.length - 1} tech records and added ${inputEvent.length - 1} to sqs`);

      const inspectPlateOne = await getBySystemNumberAndCreatedTimestamp(
        inputEvent[0].systemNumber,
        inputEvent[0].createdTimestamp,
      );
      const inspectPlateTwo = await getBySystemNumberAndCreatedTimestamp(
        inputEvent[1].systemNumber,
        inputEvent[1].createdTimestamp,
      );

      expect(inspectPlateOne).not.toHaveProperty('techRecord_plates_0_plateIssuer');
      expect(inspectPlateTwo).toEqual(expect.objectContaining({ techRecord_plates_0_plateIssuer: batchIssuerName }));
    });
  });
});
