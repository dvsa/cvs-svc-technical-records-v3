import { APIGatewayProxyEvent } from 'aws-lambda';
import { getGetErrors } from '../../../src/validators/get';

describe('test the get error validator', () => {
  it('should return missing system number', () => {
    const event = { pathParameters: { createdTimestamp: '12345' } };
    const res = getGetErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing system number',
    });
  });

  it('should return missing created timestamp', () => {
    const event = { pathParameters: { systemNumber: '12345' } };
    const res = getGetErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing created timestamp',
    });
  });

  it('should return when system number is too short', () => {
    const event = { pathParameters: { systemNumber: '12', createdTimestamp: '12345' } };
    const res = getGetErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    });
  });

  it('should return when system number is too long', () => {
    const event = { pathParameters: { systemNumber: '123456789123456789123456789', createdTimestamp: '12345' } };
    const res = getGetErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    });
  });

  it('should return when timestamp is not a valid format', () => {
    const event = { pathParameters: { systemNumber: '123456789', createdTimestamp: '12345' } };
    const res = getGetErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid created timestamp',
    });
  });

  it('should return undefined when no errors', () => {
    const event = { pathParameters: { systemNumber: '123456789', createdTimestamp: '2023-02-07T10:39:47.000000Z' } };
    const res = getGetErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });
});
