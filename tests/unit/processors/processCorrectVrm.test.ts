/* eslint-disable import/first */
const mockCorrectVrm = jest.fn();
const mockSearchByCriteria = jest.fn();

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { processCorrectVrm } from '../../../src/processors/processCorrectVrm';
import postCarData from '../../resources/techRecordCarPost.json';
import { StatusCode } from '../../../src/util/enum';

jest.mock('../../../src/services/database', () => ({
  correctVrm: mockCorrectVrm,
  searchByCriteria: mockSearchByCriteria

}));

describe('processCorrectVrm', () => {
  const mockUserDetails = {
    username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
  };
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  describe('successful if VRM is not on an current or provisional record', () => {
    it('returns a new record and an undefined record to archive', async () => {
      const mockRecordFromDb = postCarData as TechRecordType<'get'>;
      mockSearchByCriteria.mockResolvedValueOnce([])
      mockCorrectVrm.mockResolvedValueOnce({})
      const result = await processCorrectVrm(mockRecordFromDb, mockUserDetails, 'FOOBAR');
      expect(mockCorrectVrm).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
  });
  it('fails if VRM is on a current or provisional record', async () => {
    const mockRecordFromDb = postCarData as TechRecordType<'get'>;
    mockSearchByCriteria.mockResolvedValueOnce([{...postCarData, techRecord_statusCode: StatusCode.CURRENT}])
    mockCorrectVrm.mockResolvedValueOnce({})
    const result = await processCorrectVrm(mockRecordFromDb, mockUserDetails, '991234Z');
    expect(mockCorrectVrm).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toBe(400);
    expect(result.body).not.toBeNull();
  });
});

