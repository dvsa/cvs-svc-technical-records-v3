/* eslint-disable import/first */
const mockSearchByCriteria = jest.fn();
const mockGetBySysNumTime = jest.fn();
import { donorVehicle } from '../../../src/services/donorVehicle';
import { addHttpHeaders } from '../../../src/util/httpHeaders';
import carData from '../../resources/techRecordCarPost.json';

jest.mock('../../../src/services/database', () => ({
  searchByCriteria: mockSearchByCriteria,
  getBySystemNumberAndCreatedTimestamp: mockGetBySysNumTime,
}));

describe('donorVehicle', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  it('if no thirdMark is present should return two empty objects.', async () => {
    const result = await donorVehicle('DONORVRM');
    expect(result).toEqual(expect.arrayContaining([{}, {}]));
  });
  it('if a thirdMark is present should search for and return a current record if there is one.', async () => {
    const mockSearchReturn = [
      {
        primaryVrm: 'DONORVRM',
        vin: 'TESTVIN',
        techRecord_statusCode: 'current',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2023-09-11T13:54:32.431Z',
        systemNumber: '0123456',
        techRecord_manufactureYear: 2001,
      },
      {
        primaryVrm: 'DONORVRM',
        vin: 'TESTVIN',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2023-09-11T12:54:32.431Z',
        systemNumber: '0123456',
        techRecord_manufactureYear: 2001,
      },
    ];
    const mockCarRecord = { ...carData, primaryVrm: 'DONORVRM' };
    mockSearchByCriteria.mockResolvedValueOnce(mockSearchReturn);
    mockGetBySysNumTime.mockResolvedValueOnce(mockCarRecord);
    const result = await donorVehicle('DONORVRM', 'NEWVRM');
    expect(result).toEqual(expect.arrayContaining([mockCarRecord, {}]));
    expect(mockGetBySysNumTime).toHaveBeenCalledWith('0123456', '2023-09-11T13:54:32.431Z');
  });
});
describe('error  handling', () => {
  it('should return an error if no current record is available for the donor vehicle.', async () => {
    const mockSearchReturn = [
      {
        primaryVrm: 'DONORVRM',
        vin: 'TESTVIN',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2023-09-11T13:54:32.431Z',
        systemNumber: '0123456',
        techRecord_manufactureYear: 2001,
      },
      {
        primaryVrm: 'DONORVRM',
        vin: 'TESTVIN',
        techRecord_statusCode: 'archived',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2023-09-11T12:54:32.431Z',
        systemNumber: '0123456',
        techRecord_manufactureYear: 2001,
      },
    ];
    mockSearchByCriteria.mockResolvedValueOnce(mockSearchReturn);
    const result = await donorVehicle('DONORVRM', 'NEWVRM');
    expect(result).toEqual(expect.arrayContaining([
      {},
      addHttpHeaders({ statusCode: 400, body: 'no vehicles with VRM DONORVRM have a current record' })]));
  });
  it('should return an error if new donor vrm format incorrect.', async () => {
    const mockSearchReturn = [
      {
        primaryVrm: 'DONORVRM',
        vin: 'TESTVIN',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2023-09-11T13:54:32.431Z',
        systemNumber: '0123456',
        techRecord_manufactureYear: 2001,
      },
      {
        primaryVrm: 'DONORVRM',
        vin: 'TESTVIN',
        techRecord_statusCode: 'archived',
        techRecord_vehicleType: 'car',
        createdTimestamp: '2023-09-11T12:54:32.431Z',
        systemNumber: '0123456',
        techRecord_manufactureYear: 2001,
      },
    ];
    mockSearchByCriteria.mockResolvedValueOnce(mockSearchReturn);
    const mockCarRecord = { ...carData, primaryVrm: 'DONORVRM' };
    mockGetBySysNumTime.mockResolvedValueOnce(mockCarRecord);
    const result = await donorVehicle('DONORVRM', 'NEWVRM!');
    expect(result).toEqual(expect.arrayContaining([
      {},
      addHttpHeaders({ statusCode: 400, body: 'Invalid VRM' })]));
  });
});
