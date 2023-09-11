/* eslint-disable import/first */
const mockUpdateVehicle = jest.fn();
const mockSearchByCriteria = jest.fn();
const mockGetBySysNumTimestamp = jest.fn();

import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';
import { APIGatewayProxyResult } from 'aws-lambda';
import { processCherishedTransfer } from '../../../src/processors/processCherishedTransfer';
import postCarData from '../../resources/techRecordCarPost.json';
import { StatusCode } from '../../../src/util/enum';
import { SearchResult } from '../../../src/models/search';
import { addHttpHeaders } from '../../../src/util/httpHeaders';

jest.mock('../../../src/services/database', () => ({
  updateVehicle: mockUpdateVehicle,
  searchByCriteria: mockSearchByCriteria,
  getBySystemNumberAndCreatedTimestamp: mockGetBySysNumTimestamp,

}));

const updateRecordReturned = {
  primaryVrm: 'DONORVRM',
  secondaryVrms: [
    ' ', '991234Z',
  ],
  techRecord_createdByName: 'Test User',
  techRecord_createdById: 'QWERTY',
  techRecord_reasonForCreation: 'Update VRM - Cherished Transfer',
  techRecord_statusCode: 'current',
  techRecord_vehicleType: 'car',
  vin: 'AA11100851',
};

const recipientRecordToArchive = {
  primaryVrm: '991234Z',
  secondaryVrms: [
    ' ',
  ],
  techRecord_createdByName: 'foo',
  techRecord_createdById: 'foo',
  techRecord_reasonForCreation: ' ',
  techRecord_statusCode: 'archived',
  techRecord_lastUpdatedByName: 'Test User',
  techRecord_lastUpdatedById: 'QWERTY',
};

const donorVehicleUpdated = {
  primaryVrm: '012345',
  secondaryVrms: [
    'testing', 'DONORVRM',
  ],
  techRecord_createdByName: 'Test User',
  techRecord_createdById: 'QWERTY',
  techRecord_reasonForCreation: 'Update VRM - Cherished Transfer',
  techRecord_statusCode: 'current',
  techRecord_vehicleType: 'car',
  vin: 'AA11100851',
};

const donorRecordToArchive = {
  primaryVrm: 'DONORVRM',
  secondaryVrms: [
    'testing',
  ],
  techRecord_createdByName: 'foo',
  techRecord_createdById: 'foo',
  techRecord_euVehicleCategory: 'm1',
  techRecord_reasonForCreation: ' ',
  techRecord_statusCode: 'archived',
  vin: 'AA11100851',
  techRecord_lastUpdatedByName: 'Test User',
  techRecord_lastUpdatedById: 'QWERTY',
};

describe('processCherishedTransfer', () => {
  const mockUserDetails = {
    username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
  };
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  it('should return updated vehicle records correctly formatted', () => {
    const recipientMockRecord = { ...postCarData, techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const donorMockRecord = {
      ...postCarData, primaryVrm: 'DONORVRM', secondaryVrms: ['testing'], techRecord_statusCode: StatusCode.CURRENT,
    } as TechRecordType<'get'>;

    const result = processCherishedTransfer(mockUserDetails, 'DONORVRM', recipientMockRecord, '012345', donorMockRecord);

    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining(recipientRecordToArchive),
          expect.objectContaining(donorRecordToArchive),
          expect.objectContaining(updateRecordReturned),
          expect.objectContaining(donorVehicleUpdated),
        ],
      ),
    );
  });
  it('should send update Vehicles with correctly formatted vehicles when no newDonorVrm sent', () => {
    const recipientMockRecord = { ...postCarData, techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const newRecord = {
      primaryVrm: 'NEWVRM',
      secondaryVrms: [
        ' ', '991234Z',
      ],
      techRecord_createdByName: 'Test User',
      techRecord_createdById: 'QWERTY',
      techRecord_reasonForCreation: 'Update VRM - Cherished Transfer',
      techRecord_statusCode: 'current',
      techRecord_vehicleType: 'car',
      vin: 'AA11100851',
    };

    const result = processCherishedTransfer(mockUserDetails, 'NEWVRM', recipientMockRecord);

    expect(result).toEqual(
      expect.arrayContaining(
        [
          expect.objectContaining(recipientRecordToArchive),
          expect.objectContaining(newRecord),
        ],
      ),
    );
  });
});
