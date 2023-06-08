import { APIGatewayProxyEvent } from 'aws-lambda';
import { getSearchErrors } from '../../../src/validators/search';

describe('test the get error validator', () => {
  it('should return an error when no search identifier is given', () => {
    const event = { pathParameters: { foo: '12345' } };
    const res = getSearchErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing vehicle search identifier',
    });
  });

  it('should return an error when a wrong search criteria is given', () => {
    const event = { pathParameters: { searchIdentifier: '12345' }, queryStringParameters: { searchCriteria: 'bar' } };
    const res = getSearchErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid search criteria',
    });
  });

  it('should return when system number is too short', () => {
    const event = { pathParameters: { searchIdentifier: '12' }, queryStringParameters: { searchCriteria: 'all' } };
    const res = getSearchErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The search identifier should be between 3 and 21 characters.',
    });
  });

  it('should return when system number is too long', () => {
    const event = { pathParameters: { searchIdentifier: '123456789123456789123456789' }, queryStringParameters: { searchCriteria: 'all' } };
    const res = getSearchErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The search identifier should be between 3 and 21 characters.',
    });
  });

  it('should be undefined if no errors', () => {
    const event = { pathParameters: { searchIdentifier: '12345' }, queryStringParameters: { searchCriteria: 'all' } };
    const res = getSearchErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });
});
