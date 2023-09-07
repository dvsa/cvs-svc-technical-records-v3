/* eslint-disable import/first */
const mockUpdateVehicle = jest.fn();
const mockSearchByCriteria = jest.fn();
const mockGetBySysNumTimestamp = jest.fn();

import { TechRecordType } from "@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb";
import { processCherishedTransfer } from "../../../src/processors/processCherishedTransfer";
import postCarData from '../../resources/techRecordCarPost.json';
import { StatusCode } from "../../../src/util/enum";
import { SearchResult } from "../../../src/models/search";
import { addHttpHeaders } from "../../../src/util/httpHeaders";
import { APIGatewayProxyResult } from "aws-lambda";

jest.mock('../../../src/services/database', () => ({
  updateVehicle: mockUpdateVehicle,
  searchByCriteria: mockSearchByCriteria,
  getBySystemNumberAndCreatedTimestamp: mockGetBySysNumTimestamp

}));

const dateToUse = new Date();

const updateRecordReturned = {
  primaryVrm: 'DONORVRM',
  secondaryVrms: [
    " ", "991234Z"
  ],
  techRecord_createdByName:'Test User',
  techRecord_createdById:'QWERTY',
  techRecord_reasonForCreation: 'Update VRM - Cherished Transfer',
  techRecord_statusCode: "current",
  techRecord_vehicleType: "car",
  vin: "AA11100851"
}

const recipientRecordToArchive = {
  primaryVrm: "991234Z",
  secondaryVrms: [
    " "
  ],
  techRecord_createdByName:"foo",
  techRecord_createdById:"foo",
  techRecord_reasonForCreation: " ",
  techRecord_statusCode: "archived",
  techRecord_lastUpdatedByName: 'Test User',
  techRecord_lastUpdatedById:'QWERTY'
}

const donorVehicleUpdated = {
  primaryVrm: "012345",
  secondaryVrms: [
    'testing', 'DONORVRM'
  ],
  techRecord_createdByName:"foo",
  techRecord_createdById:"foo",
  techRecord_euVehicleCategory: "m1",
  techRecord_reasonForCreation: " ",
  techRecord_statusCode: "current",
  vin: "AA11100851",
  techRecord_lastUpdatedByName: 'Test User',
  techRecord_lastUpdatedById:'QWERTY'
}


describe('processCherishedTransfer', () => {
  const mockUserDetails = {
    username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
  };
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  it('should send update Vehicles with correctly formatted vehicles ', async () => {
    const recipientMockRecord = { ...postCarData, techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const donorMockRecord = { ...postCarData, primaryVrm: 'DONORVRM', secondaryVrms: ['testing'], techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const mockSearchReturn = {
      primaryVrm: "FOOBAR",
      vin: "TESTVIN",
      techRecord_statusCode: "current",
      techRecord_vehicleType: "car",
      createdTimestamp: new Date(),
      systemNumber: '012345',
      techRecord_manufactureYear: 1989,
    }
    mockSearchByCriteria.mockResolvedValueOnce([mockSearchReturn]);
    mockGetBySysNumTimestamp.mockResolvedValueOnce(donorMockRecord);
    await processCherishedTransfer(mockUserDetails, 'DONORVRM', '012345', recipientMockRecord);
    expect(mockUpdateVehicle).toBeCalledTimes(1)
    expect(mockUpdateVehicle).toHaveBeenCalledWith(
      expect.arrayContaining(
        [
          expect.objectContaining(donorVehicleUpdated),
          expect.objectContaining(recipientRecordToArchive)
        ]),
        expect.arrayContaining([expect.objectContaining(updateRecordReturned)])
    )
  });
  it('should throw an error if there is no current record for the donor vehicle', async () => {
    const recipientMockRecord = { ...postCarData, techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const donorMockRecord = { ...postCarData, primaryVrm: 'DONORVRM', secondaryVrms: ['testing'], techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const mockSearchReturn =[{
      primaryVrm: "FOOBAR",
      vin: "TESTVIN",
      techRecord_statusCode: "archived",
      techRecord_vehicleType: "car",
      createdTimestamp: new Date(),
      systemNumber: '012345',
      techRecord_manufactureYear: 1989,
    },
    {
      primaryVrm: "FOOBAR",
      vin: "TESTVIN",
      techRecord_statusCode: "provisional",
      techRecord_vehicleType: "car",
      createdTimestamp: new Date(),
      systemNumber: '012345',
      techRecord_manufactureYear: 1989,
    }]
    mockSearchByCriteria.mockResolvedValueOnce(mockSearchReturn);
    mockGetBySysNumTimestamp.mockResolvedValueOnce(donorMockRecord);
    const result = await processCherishedTransfer(mockUserDetails, 'DONORVRM', '012345', recipientMockRecord);
    expect(result).toEqual(addHttpHeaders({statusCode: 400, body: 'no vehicles with VRM DONORVRM have a current record'}))
})
it('should return an error if an invalid VRM is supplied for the donor', async () => {
  const recipientMockRecord = { ...postCarData, techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const donorMockRecord = { ...postCarData, primaryVrm: 'DONORVRM', secondaryVrms: ['testing'], techRecord_statusCode: StatusCode.CURRENT } as TechRecordType<'get'>;
    const mockSearchReturn = {
      primaryVrm: "FOOBAR",
      vin: "TESTVIN",
      techRecord_statusCode: "current",
      techRecord_vehicleType: "car",
      createdTimestamp: new Date(),
      systemNumber: '012345',
      techRecord_manufactureYear: 1989,
    }
    mockSearchByCriteria.mockResolvedValueOnce([mockSearchReturn]);
    mockGetBySysNumTimestamp.mockResolvedValueOnce(donorMockRecord);
    const result = await processCherishedTransfer(mockUserDetails, 'DONORVRM', '0!', recipientMockRecord);
    expect(result).toEqual(addHttpHeaders({statusCode: 400, body: 'Invalid VRM'}))

})

});
