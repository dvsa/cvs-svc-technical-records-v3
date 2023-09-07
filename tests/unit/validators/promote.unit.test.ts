import { APIGatewayProxyEvent } from 'aws-lambda';
import { validatePromoteErrors } from '../../../src/validators/promote';
import { mockToken } from '../util/mockToken';

describe('test the promote error validator', () => {
  it('should return Missing authorization header', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForPromoting: 'Just a test for promoting' }),
      headers: {},
    };
    const res = validatePromoteErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing authorization header',
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
    const res = validatePromoteErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'invalid request',
    });
  });

  it('should return an error when reasonForPromoting is empty', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForPromoting: '' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validatePromoteErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Reason for promoting not provided',
    });
  });

  it('should return undefined when no errors', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForPromoting: 'Just a test for promoting' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validatePromoteErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });
});
