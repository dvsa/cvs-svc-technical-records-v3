/* eslint-disable import/first */
const mockValidateSysNumTimestampPathParams = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda';
import { validateLetterErrors } from '../../../src/validators/letter';

jest.mock('../../../src/validators/sysNumTimestamp', () => ({
  validateSysNumTimestampPathParams: mockValidateSysNumTimestampPathParams,
}));

describe('Test letter validator', () => {
  describe('validateLEtterErrors', () => {
    it('should error if there is an error with systemNumber or createdTimestamp', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce({
        statusCode: 400,
        body: 'Missing system number',
      });
      const res = validateLetterErrors({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Missing system number' });
    });

    it('should error if there is an empty body', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateLetterErrors({} as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'invalid request' });
    });

    it('should error if there is no letter type', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateLetterErrors({ body: JSON.stringify({ foo: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Letter type not provided' });
    });

    it('should error if there is no paragraphId', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateLetterErrors({ body: JSON.stringify({ letterType: 'bar' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'Paragraph ID not provided' });
    });

    it('should error if there is no vtmUsername', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateLetterErrors({ body: JSON.stringify({ letterType: 'bar', paragraphId: '123' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'No username provided' });
    });

    it('should error if there is no recipientEmailAddress', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateLetterErrors({ body: JSON.stringify({ letterType: 'bar', paragraphId: '123', vtmUsername: 'foo' }) } as unknown as APIGatewayProxyEvent);
      expect(res).toEqual({ statusCode: 400, body: 'No recipient email provided' });
    });

    it('should pass and return undefined', () => {
      mockValidateSysNumTimestampPathParams.mockReturnValueOnce(undefined);
      const res = validateLetterErrors({
        body: JSON.stringify({
          letterType: 'bar', paragraphId: '123', vtmUsername: 'foo', recipientEmailAddress: 'n@n.com',
        }),
      } as unknown as APIGatewayProxyEvent);
      expect(res).toBeUndefined();
    });
  });
});
