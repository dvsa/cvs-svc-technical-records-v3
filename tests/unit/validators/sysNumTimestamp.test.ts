import { APIGatewayProxyEvent } from 'aws-lambda';
import { validateSysNumTimestampPathParams } from '../../../src/validators/sysNumTimestamp';

const headers = {
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Origin': '*',
};

describe('test the get error validator', () => {
  it('should return missing system number', () => {
    const event = { pathParameters: { createdTimestamp: '12345' } };
    const res = validateSysNumTimestampPathParams(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing system number',
      headers,
    });
  });

  it('should return missing created timestamp', () => {
    const event = { pathParameters: { systemNumber: '12345' } };
    const res = validateSysNumTimestampPathParams(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing created timestamp',
      headers,
    });
  });

  it('should return when system number is too short', () => {
    const event = { pathParameters: { systemNumber: '12', createdTimestamp: '12345' } };
    const res = validateSysNumTimestampPathParams(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
      headers,
    });
  });

  it('should return when system number is too long', () => {
    const event = { pathParameters: { systemNumber: '123456789123456789123456789', createdTimestamp: '12345' } };
    const res = validateSysNumTimestampPathParams(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
      headers,
    });
  });

  it('should return when timestamp is not a valid format', () => {
    const event = { pathParameters: { systemNumber: '123456789', createdTimestamp: '12345' } };
    const res = validateSysNumTimestampPathParams(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid created timestamp',
      headers,
    });
  });

  it('should return undefined when no errors', () => {
    const event = { pathParameters: { systemNumber: '123456789', createdTimestamp: '2023-02-07T10:39:47.000000Z' } };
    const res = validateSysNumTimestampPathParams(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });
});
