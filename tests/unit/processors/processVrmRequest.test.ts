import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  TechrecordGet,
} from '../../../src/models/post';
import { processPatchVrmRequest } from '../../../src/processors/processVrmRequest';
import postCarData from '../../resources/techRecordCarPost.json';

describe('processVrmRequest', () => {
  it('returns updated records to archive and to add', () => {
    const event = {
      resource: '/',
      path: '/',
      httpMethod: 'PATCH',
      requestContext: {
        resourcePath: '/',
        httpMethod: 'PATCH',
        path: '/Prod/',
      },
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      },
      multiValueHeaders: {
        accept: [
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        ],
        'accept-encoding': [
          'gzip, deflate, br',
        ],
      },
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      body: JSON.stringify({ newIdentifier: 'foo' }),
      isBase64Encoded: false,
    };
    const mockRecordFromDb = postCarData as TechrecordGet;
    const [recordToArchive, updatedNewRecord] = processPatchVrmRequest(mockRecordFromDb, event as unknown as APIGatewayProxyEvent);
    expect(updatedNewRecord).toEqual(expect.objectContaining({
      primaryVrm: 'FOO',
    }));
    expect(recordToArchive).toEqual(expect.objectContaining({
      primaryVrm: '991234Z',
    }));
  });
});
