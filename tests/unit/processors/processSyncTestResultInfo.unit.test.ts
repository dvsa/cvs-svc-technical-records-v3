/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockUpdateVehicle = jest.fn();
const mockSearchByCriteria = jest.fn();
import { syncTestResultInfo } from '../../../src/processors/processSyncTestResultInfo';
import { ERRORS } from '../../../src/util/enum';
import hgvData from '../../resources/tech-records-hgv-get.json';
import { EUVehicleCategory } from '@dvsa/cvs-type-definitions/types/v3/tech-record/enums/euVehicleCategory.enum.js';

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  updateVehicle: mockUpdateVehicle,
  searchByCriteria: mockSearchByCriteria,
}));

describe('syncTestResultInfo', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  describe('Error handling', () => {
    it('should throw error if record is not in db', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([]);
      await expect(syncTestResultInfo('123', 'submitted', 'pass', '47', '012345', 'Test User', EUVehicleCategory.M2))
        .rejects.toThrow('Cannot find record with systemNumber 123');
    });
    it('should throw error if record is archived', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([{ techRecord_statusCode: 'archived' }]);
      await expect(syncTestResultInfo('123', 'submitted', 'pass', '47', '012345', 'Test User', EUVehicleCategory.M2))
        .rejects.toThrow(ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD);
    });
    it('should throw error if more than two non-archived records', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([
        { techRecord_statusCode: 'provisional' },
        { techRecord_statusCode: 'provisional' },
        { techRecord_statusCode: 'current' }]);
      await expect(syncTestResultInfo('123', 'submitted', 'pass', '47', '012345', 'Test User', EUVehicleCategory.M2))
        .rejects.toThrow(ERRORS.MORE_THAN_TWO_NON_ARCHIVED_TECH_RECORDS);
    });
  });

  describe('Success response', () => {
    it('should call update if record is provisional', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([{ techRecord_statusCode: 'provisional' }]);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce([hgvData[0]]);
      mockUpdateVehicle.mockResolvedValueOnce({ techRecord_statusCode: 'current' });
      await syncTestResultInfo('5000', 'submitted', 'pass', '47', '012345', 'Test User', EUVehicleCategory.M2);

      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
    });
    it('should call update if record is missing EU vehicle category', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([{ techRecord_statusCode: 'current' }]);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce([hgvData[1]]);
      mockUpdateVehicle.mockResolvedValueOnce({ techRecord_statusCode: 'current' });
      await syncTestResultInfo('5000', 'submitted', 'pass', '10', '012345', 'Test User', EUVehicleCategory.M2);

      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
    });
    it('should call update if multiple records are missing EU vehicle category, but not a provisional compatible test', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([{ techRecord_statusCode: 'current' }, { techRecord_statusCode: 'provisional' }]);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData[1]);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData[0]);
      mockUpdateVehicle.mockResolvedValueOnce({ techRecord_statusCode: 'current' });
      await syncTestResultInfo('5000', 'submitted', 'pass', '10', '012345', 'Test User', EUVehicleCategory.M2);

      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(2);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(1);
    });
    it('should not call update if record is current and EuVehicleCatergory is not updated', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([{ techRecord_statusCode: 'current' }]);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData[1]);
      await syncTestResultInfo('5000', 'submitted', 'pass', '47', '012345', 'Test User', undefined);

      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(0);
    });
    it('should not call update if record is provisional and test is not for provisional record', async () => {
      mockSearchByCriteria.mockResolvedValueOnce([{ techRecord_statusCode: 'provisional' }]);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(hgvData[0]);
      await syncTestResultInfo('5000', 'submitted', 'pass', '10', '012345', 'Test User', undefined);

      expect(mockSearchByCriteria).toHaveBeenCalledTimes(1);
      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockUpdateVehicle).toHaveBeenCalledTimes(0);
    });
  });
});
