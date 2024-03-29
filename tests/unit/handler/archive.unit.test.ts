/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const mockArchiveRecord = jest.fn();
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  archiveRecord: mockArchiveRecord,
}));

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { cloneDeep } from 'lodash';
import { handler } from '../../../src/handler/archive';
import { StatusCode } from '../../../src/util/enum';
import archivePatchData from '../../resources/techRecordArchiveRecord.json';
import archiveRequestData from '../../resources/techRecordArchiveRequest.json';

describe('Archive Patch Lambda Function', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  describe('Successful Response', () => {
    it('should pass validation and return a 200 response', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(archivePatchData);
      mockArchiveRecord.mockResolvedValueOnce({});

      const result = await handler(archiveRequestData as unknown as APIGatewayProxyEvent);
      console.info(result);
      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
  });

  describe('Unsuccessful Response', () => {
    it('should return a 404 response when no record is found', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({});

      const result = await handler(archiveRequestData as unknown as APIGatewayProxyEvent);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(404);
      expect(result.body).toContain('No record found matching systemNumber XYZEP5JYOMM00020 and timestamp 2019-06-15T10:26:54.903Z');
    });

    it('should return a 400 response when record is already archived', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      const invalidRecordData = cloneDeep(archivePatchData);
      invalidRecordData.techRecord_statusCode = StatusCode.ARCHIVED;
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(invalidRecordData);

      const result = await handler(archiveRequestData as unknown as APIGatewayProxyEvent);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('Cannot archive an archived record');
    });
  });
});
