/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import postCarData from '../../resources/techRecordCarPost.json';
import { processRequest } from '../../../src/util/processRequest';
import postTrlData from '../../resources/techRecordsTrlPost.json';

const mockUser = { username: 'foo', email: 'foo', msOid: 'foo' };
describe('testing helper method processRequest', () => {
  it('should return a request body and have changed the systemNumber for a car', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    const request = postCarData;
    request.primaryVrm = '';
    const res = await processRequest(request, mockUser);
    expect(res.systemNumber).toBe('123');
  });
  it('should return a request body and have changed the trailer id for a trailer', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    const request = postTrlData;
    postTrlData.trailerId = '';
    const res = await processRequest(request, mockUser);
    expect(res.trailerId).toBe('123');
  });
  it('should return a request body and have changed the trailer id for a small trailer o1', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    postTrlData.trailerId = '';
    postTrlData.techRecord_euVehicleCategory = 'o1';
    const request = postTrlData;
    const res = await processRequest(request, mockUser);
    expect(res.trailerId).toBe('123');
  });

  it('should return a request body and have changed the trailer id for a small trailer o2', async () => {
    process.env.AWS_SAM_LOCAL = 'true';
    postTrlData.trailerId = '';
    postTrlData.techRecord_euVehicleCategory = 'o2';
    const request = postTrlData;
    const res = await processRequest(request, mockUser);
    expect(res.trailerId).toBe('123');
  });
});
