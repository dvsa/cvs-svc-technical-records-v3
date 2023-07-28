import {
    TechRecordGet,
} from '../../../src/models/post';
import { processPatchVrmRequest } from '../../../src/processors/processVrmRequest';
import postCarData from '../../resources/techRecordCarPost.json';

describe('processVrmRequest', () => {
  const mockUserDetails = {
    username: 'Test User', msOid: 'QWERTY', email: 'testUser@test.com',
  };
  const mockedDate = new Date(2023, 1, 1);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
    jest.resetAllMocks();
    jest.resetModules();
  });
  it('returns updated records to archive and to add', () => {
    const mockRecordFromDb = postCarData as TechRecordGet;
    const [recordToArchive, updatedNewRecord] = processPatchVrmRequest(mockRecordFromDb, mockUserDetails, 'FOO');
    expect(updatedNewRecord).toEqual(expect.objectContaining({
      primaryVrm: 'FOO',
      createdTimestamp: mockedDate.toISOString(),
      techRecord_createdByName: 'Test User',
      techRecord_createdById: 'QWERTY',
    }));
    expect(recordToArchive).toEqual(expect.objectContaining({
      primaryVrm: '991234Z',
      techRecord_statusCode: 'archived',
      techRecord_lastUpdatedByName: 'Test User',
      techRecord_lastUpdatedById: 'QWERTY',
      techRecord_lastUpdatedAt: mockedDate.toISOString(),
    }));
  });
});
