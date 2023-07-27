import { TechRecordGet } from '../../../src/models/post';
import { setCreatedAuditDetails, setLastUpdatedAuditDetails } from '../../../src/services/audit';
import { StatusCode } from '../../../src/util/enum';

describe('Audit details tests', () => {
  describe('setLastUpdatedAuditDetails', () => {
    it('should set the correct details', () => {
      const date = new Date().toISOString();

      const res = setLastUpdatedAuditDetails({} as TechRecordGet, 'user', '123', date, StatusCode.ARCHIVED);

      expect(res).toEqual({
        techRecord_lastUpdatedAt: date,
        techRecord_lastUpdatedByName: 'user',
        techRecord_lastUpdatedById: '123',
        techRecord_statusCode: StatusCode.ARCHIVED,
      });
    });
  });

  describe('setCreatedAuditDetails', () => {
    it('should set and remove correctly', () => {
      const date = new Date().toISOString();

      const res = setCreatedAuditDetails({ techRecord_lastUpdatedAt: '123', techRecord_lastUpdatedById: '123', techRecord_lastUpdatedByName: '123' } as TechRecordGet, 'user', '123', date, StatusCode.CURRENT);

      expect(res).toEqual({
        techRecord_createdAt: date,
        createdTimestamp: date,
        techRecord_createdByName: 'user',
        techRecord_createdById: '123',
        techRecord_statusCode: StatusCode.CURRENT,
      });
    });
  });
});
