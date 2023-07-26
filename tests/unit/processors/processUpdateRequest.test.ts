import {
  TechrecordGet, TechrecordHgv, TechrecordPut, TechrecordTrl,
} from '../../../src/models/post';
import { processUpdateRequest, getUpdateType, processVehicleIdentifiers } from '../../../src/processors/processUpdateRequest';
import { UserDetails } from '../../../src/services/user';
import { UpdateType } from '../../../src/util/enum';
import hgvData from '../../resources/techRecordHGVPost.json';
import trailerData from '../../resources/techRecordsTrlPost.json';

describe('getUpdateType', () => {
  it('returns updateType for the record', () => {
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
    expect(getUpdateType(mockRecord as TechrecordGet, mockRequest1 as TechrecordGet)).toEqual(UpdateType.ADR);
    expect(getUpdateType(mockRecord as TechrecordGet, mockRequest2 as TechrecordGet)).toEqual(UpdateType.TECH_RECORD_UPDATE);
    expect(getUpdateType(mockRecord as TechrecordGet, mockRequest3 as TechrecordGet)).toEqual(UpdateType.TECH_RECORD_UPDATE);
  });
});

describe('processUpdateRequest', () => {
  it('returns updated records to archive and to add', async () => {
    const mockRecordFromDb = hgvData as TechrecordGet;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', techRecord_emissionsLimit: 3 } as TechrecordPut;
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

describe('processVehicleIdentifiers', () => {
  it('should replace the vrm if present in request', () => {
    const mockRecordFromDb = hgvData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', primaryVrm: 1234 };
    const updatedRequest = processVehicleIdentifiers(mockRecordFromDb as TechrecordGet, mockRequest as unknown as TechrecordPut);
    expect((updatedRequest as TechrecordHgv).primaryVrm).toBe('GB02DAN');
  });
  it('should replace the trailer id if present in request', () => {
    const mockRecordFromDb = trailerData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', trailerId: 1234 };
    const updatedRequest = processVehicleIdentifiers(mockRecordFromDb as TechrecordGet, mockRequest as unknown as TechrecordPut);
    expect((updatedRequest as TechrecordTrl).trailerId).toBe('C000001');
  });
  it('should calculate partialVin if a new VIN is in the request', () => {
    const mockRecordFromDb = hgvData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', vin: 'Abc123456' };
    const updatedRequest = processVehicleIdentifiers(mockRecordFromDb as TechrecordGet, mockRequest as unknown as TechrecordPut);
    expect((updatedRequest as TechrecordHgv).vin).toBe('ABC123456');
    expect((updatedRequest as TechrecordHgv).partialVin).toBe('123456');
  });
  it('should use same partialVin as new VIN if VIN is less than 6 characters', () => {
    const mockRecordFromDb = hgvData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', vin: 'abc123' };
    const updatedRequest = processVehicleIdentifiers(mockRecordFromDb as TechrecordGet, mockRequest as unknown as TechrecordPut);
    expect((updatedRequest as TechrecordHgv).vin).toBe('ABC123');
    expect((updatedRequest as TechrecordHgv).partialVin).toBe('ABC123');
  });
  it('should make no changes if vehicle identifiers do not change', () => {
    const mockRecordFromDb = hgvData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update' };
    const updatedRequest = processVehicleIdentifiers(mockRecordFromDb as TechrecordGet, mockRequest as unknown as TechrecordPut);
    expect(updatedRequest).toEqual(mockRequest);
  });
});
