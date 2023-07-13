/* eslint-disable import/first */
const mockSend = jest.fn();

import { generateNewNumber, NumberTypes } from '../../../src/services/testNumber';

process.env.TEST_NUMBER_LAMBDA_NAME = 'cvs-svc-local-test-number';

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => ({
    send: mockSend,
  })),
  InvokeCommand: jest.fn(),
}));

describe('Test test Number Service', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });
  describe('Successful response with local environment variable set', () => {
    const testCases = [NumberTypes.SystemNumber, NumberTypes.TrailerId, NumberTypes.ZNumber, NumberTypes.TNumber];

    it.each(testCases)('should return a $number', async (number: NumberTypes) => {
      process.env.AWS_SAM_LOCAL = 'true';
      const result = await generateNewNumber(number);
      expect(result).toBe('123');
    });
  });
  describe('Unsuccessful response with malformed data', () => {
    const mockBody = {
      body: JSON.stringify({
        level: 'info',
        message: {
          body: '{"systemNumber":"10000021","testNumberKey":3}',
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
    it('should not return a system number', async () => {
      const result = await generateNewNumber(NumberTypes.SystemNumber);
      expect(result).toBeUndefined();
    });
  });
});
