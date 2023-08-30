import { APIGatewayProxyEvent } from 'aws-lambda';
import { ERRORS } from '../../../src/util/enum';
import { validateArchiveErrors } from '../../../src/validators/archive';
import { mockToken } from '../util/mockToken';

describe('test the archive error validator', () => {
  it('should return Missing authorization header', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForArchiving: 'Just a test for archiving' }),
      headers: {},
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: ERRORS.MISSING_AUTH_HEADER,
    });
  });

  it('should return an error when missing a request body', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: {},
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'invalid request',
    });
  });

  it('should return an error when reasonForArchiving is empty', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForArchiving: '' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Reason for archiving not provided',
    });
  });

  it('should return undefined when no errors', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForArchiving: 'Just a test for archiving' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });
});
