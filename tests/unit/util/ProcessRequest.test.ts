/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  TechRecordPUTCarComplete,
} from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/car/complete';
import { TechRecordPUTTRLComplete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/trl/complete';
import { processPostRequest } from '../../../src/processors/processPostRequest';
import postCarData from '../../resources/techRecordCarPost.json';
import postTrlData from '../../resources/techRecordsTrlPost.json';

const mockUser = { username: 'foo', email: 'foo', msOid: 'foo' };
describe('testing helper method processPostRequest', () => {
  it('should return a request body and have changed the systemNumber for a car', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    const request = postCarData as TechRecordPUTCarComplete;
    request.primaryVrm = '';
    const res = await processPostRequest(request, mockUser);
    expect(res.systemNumber).toBe('123');
  });
  it('should return a request body and have changed the trailer id for a trailer', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    const request = postTrlData as TechRecordPUTTRLComplete;
    postTrlData.trailerId = '';
    const res = await processPostRequest(request, mockUser) as TechRecordPUTTRLComplete;
    expect(res.trailerId).toBe('123');
  });
  it('should return a request body and have changed the trailer id for a small trailer o1', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    postTrlData.trailerId = '';
    postTrlData.techRecord_euVehicleCategory = 'o1';
    const request = postTrlData as TechRecordPUTTRLComplete;
    const res = await processPostRequest(request, mockUser) as TechRecordPUTTRLComplete;
    expect(res.trailerId).toBe('123');
  });

  it('should return a request body and have changed the trailer id for a small trailer o2', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    postTrlData.trailerId = '';
    postTrlData.techRecord_euVehicleCategory = 'o2';
    const request = postTrlData as TechRecordPUTTRLComplete;
    const res = await processPostRequest(request, mockUser) as TechRecordPUTTRLComplete;
    expect(res.trailerId).toBe('123');
  });
});
