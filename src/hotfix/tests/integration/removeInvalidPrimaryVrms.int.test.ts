import { seedTables } from '../../../../scripts/setup-local-tables';
import { tableName } from '../../../config';
import { handler as removePrimaryVrm } from '../../removeInvalidPrimaryVrms';
import techRecordData from './resources/technical-records-v3-invalid-primaryvrm.json';
import invalidVrms from '../../resources/invalid-primary-vrms.json';
import * as fs from 'fs';

describe('remove primary vrms function', () => {
  beforeEach(async () => {
    await seedTables([{
      table: tableName,
      data: techRecordData,
    }]);
  });

  describe('update data', () => {
    const output = [];
    for (let i = 0; i < invalidVrms.length; i++) {
      const invalidVrm = invalidVrms[i];

      const techRecord = {
        ...techRecordData[i],
        createdTimestamp: new Date(invalidVrm.createdAt).toISOString(),
        primaryVrm: invalidVrm.trailer_id,
        systemNumber: invalidVrm.system_number,
        vin: invalidVrm.vin
      };

      output.push(techRecord);
    }

    fs.writeFileSync(`./output.json`, JSON.stringify(output));
  });

  describe('happy path', () => {
    it('should remove the primary vrm', async () => {
      return true;
      process.env.AWS_SAM_LOCAL = 'true';

      // Arrange

      // (would be better to DI a DateProvider, generally speaking, but this will do for now)
      const forceUpdateTimestamp = new Date();

      // Act
      const result = await removePrimaryVrm(forceUpdateTimestamp);

      // Assert
      expect(result.statusCode).toEqual(200);

      // Only n records should have been updated
      expect(result.body).toEqual(`RPVRM: Updated ${invalidVrms.length} invalid tech records`);

      // Sanity check, ensure the primary vrm was falsified.
      for (const tr of invalidVrms) {
        const systemNumber = tr.system_number;
        const date = forceUpdateTimestamp.toISOString();

        const response = await fetch(`http://127.0.0.1:3000/v3/technical-records/${systemNumber}/${date}`);
        expect(response.status).toBe(200);

        const updatedTechRecord = await response.json();
        expect('primaryVrm' in updatedTechRecord).toBeFalsy();
      }

      // const updatedResponse = await fetch(
      //   `http://127.0.0.1:3000/v3/technical-records/${systemNumber}/${forceUpdateTimestamp.toISOString()}`
      // );

      // expect(updatedResponse.status).toBe(200);

      // const updatedTechRecord = await updatedResponse.json();

      // expect('primaryVrm' in updatedTechRecord).toBeFalsy();
    });
  });

  // describe('unhappy path', () => {
  //   it('should return an error message if vehicle type is missing', async () => {
  //     const response = await fetch(
  //       'http:/127.0.0.1:3000/v3/technical-records',
  //       {
  //         method: 'POST',
  //         body: JSON.stringify({}),
  //         headers: {
  //           Authorization: mockToken,
  //         },
  //       },
  //     );

  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const json = await response.json();

  //     expect(json).toEqual({ errors: [ERRORS.VEHICLE_TYPE_ERROR] });
  //     expect(response.status).toBe(400);
  //   });

  //   it('should return the required fields to create if the body does not have them', async () => {
  //     const body = { techRecord_vehicleType: 'psv' };
  //     const response = await fetch(
  //       'http:/127.0.0.1:3000/v3/technical-records',
  //       {
  //         method: 'POST',
  //         body: JSON.stringify(body),
  //         headers: {
  //           Authorization: mockToken,
  //         },
  //       },
  //     );

  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const json = await response.json();

  //     const requiredFields = psvSchema.required
  //       .filter((field) => !Object.keys(body).includes(field))
  //       .map((field: string) => `must have required property '${field}'`);

  //     expect(json).toEqual({ errors: requiredFields });
  //     expect(response.status).toBe(400);
  //   });
  // });
});
