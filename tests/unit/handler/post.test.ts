/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const mockPostTechRecord = jest.fn();

jest.mock('../../../src/services/database.ts', () => ({
  postTechRecord: mockPostTechRecord,
}));

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../../src/handler/post';
import postTrlData from '../../resources/techRecordsTrlPost.json';

describe('Test Post Lambda Function', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  describe('Successful response', () => {
    const event = {
      resource: '/',
      path: '/',
      httpMethod: 'GET',
      requestContext: {
        resourcePath: '/',
        httpMethod: 'GET',
        path: '/Prod/',
      },
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
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
      body: JSON.stringify(postTrlData),
      isBase64Encoded: false,
    };
    it('should pass validation and return a 200 response', async () => {
      process.env.AWS_SAM_LOCAL = 'true';
      mockPostTechRecord.mockResolvedValueOnce(postTrlData);
      const result = await handler(event as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);
      expect(result.body).not.toBeNull();
    });
  });
  describe('Error handling', () => {
    const event = {
      resource: '/',
      path: '/',
      httpMethod: 'GET',
      requestContext: {
        resourcePath: '/',
        httpMethod: 'GET',
        path: '/Prod/',
      },
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
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
      body: JSON.stringify(postTrlData),
      isBase64Encoded: false,
    };
    it('should return 400 when event has no body', async () => {
      const result = await handler({ body: null } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('Body is not a valid TechRecord');
    });
    it('should return 400 when validation is triggered', async () => {
      postTrlData.techRecord_statusCode = 'foo';

      const result = await handler({ body: JSON.stringify(postTrlData) } as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('Invalid Technical Record');
    });
    it('should return 500 when error is thrown', async () => {
      mockPostTechRecord.mockImplementationOnce(() => {
        throw new Error();
      });
      const result = await handler(event as unknown as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(500);
      expect(result.body).toMatch('Failed to add record to DynamoDB');
    });
  });
});
