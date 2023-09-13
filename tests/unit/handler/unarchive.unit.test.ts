/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const mockUnarchiveRecord = jest.fn();
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockSearchByCriteriaRecords = jest.fn();

jest.mock('../../../src/services/database.ts', () => ({
  getBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
  searchByCriteria: mockSearchByCriteriaRecords,
  postTechRecord: mockUnarchiveRecord,
}));

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { cloneDeep } from 'lodash';
import { handler } from '../../../src/handler/unarchive';
import { StatusCode } from '../../../src/util/enum';
import unarchivePostData from '../../resources/techRecordUnarchiveRecord.json';
import unarchiveRequestData from '../../resources/techRecordUnarchiveRequest.json';
import postCarData from '../../resources/techRecordCarPost.json';

describe('Unarchive Post Lambda Function', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  describe('Successful Response', () => {
    it('should pass validation and return a 200 response', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(unarchivePostData);
      mockSearchByCriteriaRecords.mockResolvedValueOnce([
        {
          techRecord_model: null,
          techRecord_manufactureYear: null,
          techRecord_make: null,
          techRecord_statusCode: 'archived',
          createdTimestamp: '2019-06-22T12:00:00.904Z',
          systemNumber: '12346574',
          vin: 'DP76UMK4DQLTOT',
          primaryVrm: 'RATMEM00066',
          techRecord_vehicleType: 'car',
        },
      ]);
      mockUnarchiveRecord.mockResolvedValueOnce(postCarData);

      const result = await handler(unarchiveRequestData as unknown as APIGatewayProxyEvent);
      console.info(result);
      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockSearchByCriteriaRecords).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
  });

  describe('Unsuccessful Response', () => {
    it('should return a 404 response when no record is found', async () => {
      process.env.AWS_SAM_LOCAL = 'true';

      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce({});

      const result = await handler(unarchiveRequestData as unknown as APIGatewayProxyEvent);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(404);
      expect(result.body).toContain('No record found matching systemNumber 8AJWFM00066 and timestamp 2019-06-15T10:56:19.903Z');
    });

    it('should return a 400 response when record is not archived', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      const invalidRecordData = cloneDeep(unarchivePostData);
      invalidRecordData.techRecord_statusCode = StatusCode.CURRENT;
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(invalidRecordData);

      const result = await handler(unarchiveRequestData as unknown as APIGatewayProxyEvent);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('Record provided is not an archived record so cannot be unarchived');
    });

    it('should return a 400 response when there other records with the same vrm which are not archived', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      const invalidRecordData = cloneDeep(unarchivePostData);
      mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(invalidRecordData);
      mockSearchByCriteriaRecords.mockResolvedValueOnce([
        {
          techRecord_model: null,
          techRecord_manufactureYear: null,
          techRecord_make: null,
          techRecord_statusCode: 'provisional',
          createdTimestamp: '2019-06-22T12:00:00.904Z',
          systemNumber: '123465749',
          vin: 'DP76UMK4DQLTOT',
          primaryVrm: 'RATMEM00066',
          techRecord_vehicleType: 'car',
        },
      ]);

      const result = await handler(unarchiveRequestData as unknown as APIGatewayProxyEvent);

      expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockSearchByCriteriaRecords).toHaveBeenCalledTimes(1);

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('Cannot archive a record with unarchived records');
    });
  });
});
