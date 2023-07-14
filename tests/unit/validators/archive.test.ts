import { APIGatewayProxyEvent } from 'aws-lambda';
import { validateArchiveErrors } from '../../../src/validators/archive';

describe('test the archive error validator', () => {
  it('should return Missing authorization header', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
      headers: {}
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing authorization header',
    });
  });

  it('should return missing system number', () => {
    const event = {
      pathParameters: { systemNumber: '', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      }
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing system number',
    });
  });

  it('should return missing created timestamp', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '' },
      body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      }
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Missing created timestamp',
    });
  });

  it('should return when system number is too short', () => {
    const event = {
      pathParameters: { systemNumber: '12', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      }
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    });
  });

  it('should return when system number is too long', () => {
    const event = {
      pathParameters: { systemNumber: '1234582377322353656523', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      }
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'The system number should be between 3 and 21 characters.',
    });
  });

  it('should return when timestamp is not a valid format', () => {
    const event = {
      pathParameters: { systemNumber: '1234582377322', createdTimestamp: 'NotATimestamp' },
      body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      }
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toEqual({
      statusCode: 400,
      body: 'Invalid created timestamp',
    });
  });

  it('should return undefined when no errors', () => {
    const event = {
      pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' },
      body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
      }
    };
    const res = validateArchiveErrors(event as unknown as APIGatewayProxyEvent);
    expect(res).toBeUndefined();
  });
});
