import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { addVehicleIdentifiers, getUpdateType, processUpdateRequest } from '../../../src/processors/processUpdateRequest';
import { UserDetails } from '../../../src/services/user';
import { StatusCode, UpdateType } from '../../../src/util/enum';
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
    expect(getUpdateType(mockRecord as TechRecordType<'get'>, mockRequest1 as TechRecordType<'get'>)).toEqual(UpdateType.ADR);
    expect(getUpdateType(mockRecord as TechRecordType<'get'>, mockRequest2 as TechRecordType<'get'>)).toEqual(UpdateType.TECH_RECORD_UPDATE);
    expect(getUpdateType(mockRecord as TechRecordType<'get'>, mockRequest3 as TechRecordType<'get'>)).toEqual(UpdateType.TECH_RECORD_UPDATE);
  });
});

describe('processUpdateRequest', () => {
  it('returns updated records to archive and to add', () => {
    const mockRecordFromDb = hgvData as TechRecordType<'get'>;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', techRecord_emissionsLimit: 3 } as TechRecordType<'put'>;
    const mockUserDetails: UserDetails = {
      username: 'UpdateUser', msOid: 'QWERTY', email: 'UpdateUser@test.com',
    };
    const [updatedRecordFromDB, updatedNewRecord] = processUpdateRequest(mockRecordFromDb, mockRequest, mockUserDetails);
    expect(updatedRecordFromDB).toEqual(expect.objectContaining({
      techRecord_statusCode: StatusCode.ARCHIVED,
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
    addVehicleIdentifiers(mockRecordFromDb as TechRecordType<'get'>, mockRequest as unknown as TechRecordType<'put'>);
    expect(mockRequest.primaryVrm).toBe('GB02DAN');
  });
  it('should replace the trailer id if present in request', () => {
    const mockRecordFromDb = trailerData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', trailerId: 1234 };
    addVehicleIdentifiers(mockRecordFromDb as TechRecordType<'get'>, mockRequest as unknown as TechRecordType<'put'>);
    expect(mockRequest.trailerId).toBe('C000001');
  });
  it('should calculate partialVin if a new VIN is in the request', () => {
    const mockRecordFromDb = hgvData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', vin: 'Abc123456' } as TechRecordType<'get'>;
    addVehicleIdentifiers(mockRecordFromDb as TechRecordType<'get'>, mockRequest as unknown as TechRecordType<'put'>);
    expect(mockRequest.vin).toBe('ABC123456');
    expect(mockRequest.partialVin).toBe('123456');
  });
  it('should use same partialVin as new VIN if VIN is less than 6 characters', () => {
    const mockRecordFromDb = hgvData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update', vin: 'abc123' } as TechRecordType<'get'>;
    addVehicleIdentifiers(mockRecordFromDb as TechRecordType<'get'>, mockRequest as unknown as TechRecordType<'put'>);
    expect(mockRequest.vin).toBe('ABC123');
    expect(mockRequest.partialVin).toBe('ABC123');
  });
  it('should make no changes if vehicle identifiers do not change', () => {
    const mockRecordFromDb = hgvData;
    const mockRequest = { techRecord_reasonForCreation: 'Test Update' };
    addVehicleIdentifiers(mockRecordFromDb as TechRecordType<'get'>, mockRequest as unknown as TechRecordType<'put'>);
    expect(mockRequest).toEqual(mockRequest);
  });
});
