import { APIGatewayProxyEvent } from 'aws-lambda';
import { PatchRequestRecords } from '../../../src/processors/processPatchVinRequest';
import carPostData from '../../resources/techRecordCarPost.json';

describe('processPatchVinrequest', () => {
  it('should format the objects correctly', () => {
    const event = {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      },
      body: JSON.stringify({
        newVin: 'newVin',
      }),
    };
    const patchRequest: PatchRequestRecords = new PatchRequestRecords(
      carPostData,
      event as unknown as APIGatewayProxyEvent,
    );

    expect(patchRequest.newRecord).not.toEqual(patchRequest.recordToArchive);
    expect(patchRequest.newRecord.vin).toBe('NEWVIN');
    expect(patchRequest.newRecord.techRecord_createdById).toBe('123123');
    expect(patchRequest.newRecord.techRecord_createdByName).toBe('John Doe');
    expect(patchRequest.recordToArchive.vin).toBe('AA11100851');
    expect(patchRequest.recordToArchive.techRecord_lastUpdatedById).toBe('123123');
    expect(patchRequest.recordToArchive.techRecord_lastUpdatedByName).toBe('John Doe');
  });
});
