import { TechrecordGet } from '../../../src/models/post';
import { processUpdateRequest, getUpdateType } from '../../../src/processors/processUpdateRequest';
import { UserDetails } from '../../../src/services/user';
import { UpdateType } from '../../../src/util/enum';
import hgvData from '../../resources/techRecordHGVPost.json';

describe('getUpdateType', () => {
  const mockRecord = {
    techRecord_adrDetails_vehicleDetails_type: 'testType',
  };
  const mockRequest1 = {
    techRecord_adrDetails_vehicleDetails_type: 'testTypeChnage',
  };
  const mockRequest2 = {
    techRecord_vehicleType: 'trl',
  };
  const mockRequest3 = {
    techRecord_vehicleType: 'trl',
    techRecord_adrDetails_vehicleDetails_type: 'testType',
  };
  it('returns updateType for the record', () => {
    expect(getUpdateType(mockRecord as TechrecordGet, mockRequest1 as TechrecordGet)).toEqual(UpdateType.ADR);
    expect(getUpdateType(mockRecord as TechrecordGet, mockRequest2 as TechrecordGet)).toEqual(UpdateType.TECH_RECORD_UPDATE);
    expect(getUpdateType(mockRecord as TechrecordGet, mockRequest3 as TechrecordGet)).toEqual(UpdateType.TECH_RECORD_UPDATE);
  });
});

describe('processUpdateRequest', () => {
  it('returns updated records to archive and to add', async () => {
    const mockRecordFromDb = hgvData as TechrecordGet;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', techRecord_emissionsLimit: 3 } as TechrecordGet;
    const mockUserDetails: UserDetails = {
      username: 'UpdateUser', msOid: 'QWERTY', email: 'UpdateUser@test.com',
    };
    const [updatedRecordFromDB, updatedNewRecord] = await processUpdateRequest(mockRecordFromDb, mockRequest, mockUserDetails);
    expect(updatedRecordFromDB).toEqual(expect.objectContaining({
      techRecord_statusCode: 'archived',
      techRecord_lastUpdatedByName: 'UpdateUser',
      techRecord_lastUpdatedById: 'QWERTY',
      techRecord_createdByName: 'Test User',
    }));
    expect(updatedNewRecord).toEqual(expect.objectContaining({
      techRecord_reasonForCreation: 'Test Update',
      techRecord_emissionsLimit: 3,
      techRecord_createdByName: 'UpdateUser',
      techRecord_createdById: 'QWERTY',
      techRecord_axles_0_tyres_tyreCode: 428,
    }));
  });
});
