import { APIGatewayProxyEvent } from 'aws-lambda';
import { ERRORS } from '../../../src/util/enum';
import { mockToken } from '../util/mockToken';
import { validateUnarchiveErrors } from '../../../src/validators/unarchive';

describe('test the unarchive error validator', () => {
  it('should return Missing authorization header', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-22T12:00:00.904Z' },
      body: JSON.stringify({ reasonForUnarchiving: 'Just a test for unarchiving', status: 'PROVISIONAL' }),
      headers: {},
    };
    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: ERRORS.MISSING_AUTH_HEADER,
    });
  });

  it('should return an error when missing a request body', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-22T12:00:00.904Z' },
      body: {},
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'invalid request',
    });
  });

  it('should return an error when reasonForUnarchiving is empty', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForUnarchiving: '', status: 'provisional' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Reason for unarchiving not provided',
    });
  });

  it('should return an error when status is empty', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForUnarchiving: 'Just a test for unarchiving', status: '' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid status provided',
    });
  });

  it('should return an error when status is invalid', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForUnarchiving: 'Just a test for unarchiving', status: 'mockvalue' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid status provided',
    });
  });

  it('should return an error when status is archived', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForUnarchiving: 'Just a test for unarchiving', status: 'archived' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid status provided',
    });
  });

  it('should return an error when status is empty', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForUnarchiving: 'Just a test for unarchiving', status: '' }),
      headers: {
        Authorization: mockToken,
      },
    };
    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid status provided',
    });
  });

  it('should return undefined when no errors and provisional status', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForUnarchiving: 'Just a test for unarchiving', status: 'provisional' }),
      headers: {
        Authorization: mockToken,
      },
    };

    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });

  it('should return undefined when no errors and current status', () => {
    const event = {
      pathParameters: { systemNumber: 'RATMEM00066', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ reasonForUnarchiving: 'Just a test for unarchiving', status: 'current' }),
      headers: {
        Authorization: mockToken,
      },
    };

    const res = validateUnarchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });
});
