/* eslint-disable import/first */
const mockSend = jest.fn();

import {
  generateAndSendInvokeCommand,
  generateNewNumber,
  NumberTypes,
} from '../../../src/services/testNumber';

process.env.TEST_NUMBER_LAMBDA_NAME = 'cvs-svc-local-test-number';

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => ({
    send: mockSend,
  })),
  InvokeCommand: jest.fn(),
}));

describe('Test test Number Service', () => {
  describe('Successful response from generateAndSendInvokeCommand', () => {
    it('should return a system number', async () => {
      const input = {
        path: '/systemNumber/',
        httpMethod: 'POST',
        resource: '/systemNumber/',
      };
      const mockBody = {
        body: JSON.stringify({
          level: 'info',
          message: {
            body: '{"tNumber":"10000021","testNumberKey":3}',
            headers: {
              'Access-Control-Allow-Credentials': true,
              'Access-Control-Allow-Origin': '*',
              Vary: 'Origin',
              'X-Content-Type-Options': 'nosniff',
              'X-XSS-Protection': '1; mode=block',
            },
            statusCode: 200,
          },
        }),
      };
      const mockBuffer = Buffer.from(JSON.stringify(mockBody));
      mockSend.mockReturnValueOnce(Promise.resolve({ Payload: mockBuffer }));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await generateAndSendInvokeCommand(input);
      expect(result).toContain('10000021');
    });
    it('should return a t number', async () => {
      const input = {
        path: '/t-number/',
        httpMethod: 'POST',
        resource: '/t-number/',
      };
      const mockBody = {
        body: JSON.stringify({
          level: 'info',
          message: {
            body: '{"tNumber":"10000021","testNumberKey":3}',
            headers: {
              'Access-Control-Allow-Credentials': true,
              'Access-Control-Allow-Origin': '*',
              Vary: 'Origin',
              'X-Content-Type-Options': 'nosniff',
              'X-XSS-Protection': '1; mode=block',
            },
            statusCode: 200,
          },
        }),
      };
      const mockBuffer = Buffer.from(JSON.stringify(mockBody));
      mockSend.mockReturnValueOnce(Promise.resolve({ Payload: mockBuffer }));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await generateAndSendInvokeCommand(input);
      expect(result).toContain('10000021');
    });
    it('should return a trailerId', async () => {
      const input = {
        path: '/trailerId/',
        httpMethod: 'POST',
        resource: '/trailerId/',
      };
      const mockBody = {
        body: JSON.stringify({
          level: 'info',
          message: {
            body: '{"trailerId":"10000021","testNumberKey":3}',
            headers: {
              'Access-Control-Allow-Credentials': true,
              'Access-Control-Allow-Origin': '*',
              Vary: 'Origin',
              'X-Content-Type-Options': 'nosniff',
              'X-XSS-Protection': '1; mode=block',
            },
            statusCode: 200,
          },
        }),
      };
      const mockBuffer = Buffer.from(JSON.stringify(mockBody));
      mockSend.mockReturnValueOnce(Promise.resolve({ Payload: mockBuffer }));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await generateAndSendInvokeCommand(input);
      expect(result).toContain('10000021');
    });
    it('should return a z number', async () => {
      const input = {
        path: '/z-number/',
        httpMethod: 'POST',
        resource: '/z-number/',
      };
      const mockBody = {
        body: JSON.stringify({
          level: 'info',
          message: {
            body: '{"zNumber":"10000021","testNumberKey":3}',
            headers: {
              'Access-Control-Allow-Credentials': true,
              'Access-Control-Allow-Origin': '*',
              Vary: 'Origin',
              'X-Content-Type-Options': 'nosniff',
              'X-XSS-Protection': '1; mode=block',
            },
            statusCode: 200,
          },
        }),
      };
      const mockBuffer = Buffer.from(JSON.stringify(mockBody));
      mockSend.mockReturnValueOnce(Promise.resolve({ Payload: mockBuffer }));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await generateAndSendInvokeCommand(input);
      expect(result).toContain('10000021');
    });
  });
  describe('Successful response with local environment variable set', () => {
    process.env.AWS_SAM_LOCAL = 'true';
    it('should return a system number', async () => {
      const result = await generateNewNumber(NumberTypes.SystemNumber);
      expect(result).toBe('123');
    });
    it('should return a trailerId number', async () => {
      const result = await generateNewNumber(NumberTypes.TrailerId);
      expect(result).toBe('123');
    });
    it('should return a Z number', async () => {
      const result = await generateNewNumber(NumberTypes.ZNumber);
      expect(result).toBe('123');
    });
    it('should return a T number', async () => {
      const result = await generateNewNumber(NumberTypes.TNumber);
      expect(result).toBe('123');
    });
  });
});
