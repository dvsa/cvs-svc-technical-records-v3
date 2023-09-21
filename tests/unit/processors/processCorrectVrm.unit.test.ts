/* eslint-disable import/first */
const mockCorrectVrm = jest.fn();
const mockSearchByCriteria = jest.fn();

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { processCorrectVrm } from '../../../src/processors/processCorrectVrm';
import postCarData from '../../resources/techRecordCarPost.json';
import { StatusCode } from '../../../src/util/enum';

jest.mock('../../../src/services/database', () => ({
  correctVrm: mockCorrectVrm,
  searchByCriteria: mockSearchByCriteria,

}));

describe('processCorrectVrm', () => {
  const mockUserDetails = {
    username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
  };
  const updatedRecordReturned = {
    primaryVrm: 'NEWVRM',
    secondaryVrms: [
      ' ',
    ],
    techRecord_lastUpdatedByName: 'Test User',
    techRecord_lastUpdatedById: 'QWERTY',
    techRecord_statusCode: 'current',
    techRecord_vehicleType: 'car',
    vin: 'AA11100851',
  };
  it('returns a correctly formatted record', () => {
    const mockRecordFromDb = { ...postCarData, techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    mockSearchByCriteria.mockResolvedValueOnce([]);
    mockCorrectVrm.mockResolvedValueOnce({});
    const result = processCorrectVrm(mockRecordFromDb, mockUserDetails, 'NEWVRM');
    expect(result).toEqual(expect.objectContaining(updatedRecordReturned));
  });
});
