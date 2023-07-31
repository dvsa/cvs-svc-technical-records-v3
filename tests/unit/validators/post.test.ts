/* eslint-disable import/first */
const mockIdentifySchema = jest.fn();

import { APIGatewayProxyEvent } from 'aws-lambda';
import { ERRORS } from '../../../src/util/enum';
import { validatePostErrors } from '../../../src/validators/post';

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('../../../src/validators/post.ts', () => ({
  ...jest.requireActual('../../../src/validators/post.ts'),
  identifySchema: mockIdentifySchema,
}));

const trlPayload = {
  techRecord_reasonForCreation: 'VRM updated from undefined to C530005. Test dev tes 1',
  techRecord_statusCode: 'provisional',
  techRecord_vehicleClass_code: 't',
  techRecord_vehicleClass_description: 'trailer',
  techRecord_vehicleConfiguration: 'rigid',
  techRecord_vehicleType: 'trl',
  trailerId: 'C530005',
  vin: '9080977997',
};

describe('Test post errors', () => {
  it('should error if there is no body', () => {
    const event = { foo: 'bar' } as unknown as APIGatewayProxyEvent;

    const res = validatePostErrors(event);

    expect(res).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.MISSING_PAYLOAD }),
    });
  });
  it('should error if there is no auth header', () => {
    const event = { body: 'foo', headers: {} } as unknown as APIGatewayProxyEvent;

    const res = validatePostErrors(event);

    expect(res).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.MISSING_AUTH_HEADER }),
    });
  });
  it('should error if there is no vehicle Type', () => {
    const event = { body: JSON.stringify({ foo: 'bar' }), headers: { Authorization: 'Bearer 123' } } as unknown as APIGatewayProxyEvent;

    const res = validatePostErrors(event);

    expect(res).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: ERRORS.VEHICLE_TYPE_ERROR }),
    });
  });
  it('should error if there is no schema found', () => {
    const event = { body: JSON.stringify({ techRecord_vehicleType: 'random' }), headers: { Authorization: 'Bearer 123' } } as unknown as APIGatewayProxyEvent;

    const res = validatePostErrors(event);

    expect(res).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: 'Payload is invalid' }),
    });
  });
  it('should error if the object is invalid', () => {
    mockIdentifySchema.mockReturnValueOnce(undefined);

    const event = { body: JSON.stringify({ techRecord_vehicleType: 'trl' }), headers: { Authorization: 'Bearer 123' } } as unknown as APIGatewayProxyEvent;

    const res = validatePostErrors(event) as { statusCode: number;body: string; };

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body ?? '')).toEqual(expect.objectContaining({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      error: expect.arrayContaining(["must have required property 'techRecord_reasonForCreation'"]),
    }));
  });
  it('should return undefined as no errors', () => {
    const event = { body: JSON.stringify(trlPayload), headers: { Authorization: 'Bearer 123' } } as unknown as APIGatewayProxyEvent;

    const res = validatePostErrors(event);

    expect(res).toBeUndefined();
  });
});
