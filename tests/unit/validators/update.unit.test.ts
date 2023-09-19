import { APIGatewayProxyEvent } from 'aws-lambda';
import { ERRORS, StatusCode } from '../../../src/util/enum';
import { checkStatusCodeValidity, validateUpdateErrors, validateUpdateVrmRequest } from '../../../src/validators/update';
import { mockToken } from '../util/mockToken';
import { formatErrorMessage } from '../../../src/util/errorMessage';

describe('validateUpdateErrors', () => {
  it('throws error if request body is empty', () => {
    expect(validateUpdateErrors('{}')).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.MISSING_PAYLOAD),
    });
  });
  it('should error if the object is invalid', () => {
    const event = { body: JSON.stringify({ techRecord_vehicleType: 'lol' }) } as unknown as APIGatewayProxyEvent;

    const res = validateUpdateErrors(event.body);

    expect(res).toEqual({
      statusCode: 400,
      body: JSON.stringify({ error: 'Payload is invalid' }),
    });
  });
  it('should error if a field is invalid', () => {
    const event = {
      body: JSON.stringify({
        techRecord_vehicleType: 'trl',
        techRecord_statusCode: 'random',
        techRecord_vehicleClass_code: 'a',
        techRecord_vehicleClass_description: 'trailer',
        techRecord_vehicleConfiguration: 'rigid',
        techRecord_bodyType_description: 'artic',
        techRecord_bodyType_code: 'a',
        vin: '9080977997',
        techRecord_plates: [{
          plateReasonForIssue: 'random',
        }],
      }),
      headers: { Authorization: 'Bearer 123' },
    } as unknown as APIGatewayProxyEvent;

    const res = validateUpdateErrors(event.body) as { statusCode: number;body: string; };

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body ?? '')).toEqual(expect.objectContaining({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      error: expect.arrayContaining(["must have required property 'techRecord_reasonForCreation'",
        'techRecord_statusCode must be equal to one of the allowed values',
        'techRecord_plates/0/plateReasonForIssue must be equal to one of the allowed values']),
    }));
  });
  it('returns false if no errors', () => {
    const event = {
      body: JSON.stringify({
        techRecord_reasonForCreation: 'Test Update',
        techRecord_approvalType: 'NTA',
        techRecord_statusCode: 'provisional',
        techRecord_vehicleClass_code: 't',
        techRecord_vehicleClass_description: 'trailer',
        techRecord_vehicleConfiguration: 'rigid',
        techRecord_vehicleType: 'trl',
        trailerId: 'C530005',
        vin: '9080977997',
        techRecord_bodyType_description: 'artic',
        techRecord_bodyType_code: 'a',
      }),
    } as unknown as APIGatewayProxyEvent;

    const res = validateUpdateErrors(event.body);

    expect(res).toBe(false);
  });
});

describe('checkStatusCodeValidity', () => {
  it('throws error if trying to update archived record', () => {
    expect(checkStatusCodeValidity(StatusCode.ARCHIVED)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD,
    });
  });
  it('throws error if trying to archive a record', () => {
    expect(checkStatusCodeValidity(undefined, StatusCode.ARCHIVED)).toEqual({
      statusCode: 400,
      body: ERRORS.CANNOT_USE_UPDATE_TO_ARCHIVE,
    });
  });
  it('returns false if there are no errors', () => {
    expect(checkStatusCodeValidity(StatusCode.CURRENT, StatusCode.CURRENT)).toBe(false);
    expect(checkStatusCodeValidity(StatusCode.PROVISIONAL, StatusCode.CURRENT)).toBe(false);
    expect(checkStatusCodeValidity(StatusCode.PROVISIONAL, StatusCode.PROVISIONAL)).toBe(false);
    expect(checkStatusCodeValidity(StatusCode.CURRENT, StatusCode.PROVISIONAL)).toBe(false);
  });
});

describe('validateUpdateVrmRequest', () => {
  it('returns error if there is no request body', () => {
    const event = {
      body: undefined,
      pathParameters: { systemNumber: 123456, createdTimestamp: new Date().toISOString() },
    } as unknown as APIGatewayProxyEvent;
    expect(validateUpdateVrmRequest(event)).toEqual({
      statusCode: 400,
      body: 'invalid request',
    });
  });
  it('returns error if the authorization headers are missing', () => {
    const event = {
      headers: {},
      body: JSON.stringify({ newVrm: '0123456' }),
      pathParameters: { systemNumber: 123456, createdTimestamp: new Date().toISOString() },
    } as unknown as APIGatewayProxyEvent;
    expect(validateUpdateVrmRequest(event)).toEqual({
      statusCode: 400,
      body: 'Missing authorization header',
    });
  });
  it('if isCherishedTransfer returns error if new vrm missing', () => {
    const event = {
      body: JSON.stringify({ isCherishedTransfer: true, thirdMark: '123456' }),
      pathParameters: { systemNumber: 123456, createdTimestamp: new Date().toISOString() },
      headers: {
        Authorization: mockToken,
      },
    } as unknown as APIGatewayProxyEvent;
    expect(validateUpdateVrmRequest(event)).toEqual({
      statusCode: 400,
      body: 'You must provide a new VRM',
    });
  });
  it('if isCherishedTransfer returns false if everything is fine', () => {
    const event = {
      body: JSON.stringify({ newVrm: '0123456', isCherishedTransfer: true, thirdMark: '012345' }),
      pathParameters: { systemNumber: 123456, createdTimestamp: new Date().toISOString() },
      headers: {
        Authorization: mockToken,
      },
    } as unknown as APIGatewayProxyEvent;
    expect(validateUpdateVrmRequest(event)).toBe(false);
  });
  it('if !isCherishedTransfer returns error if newVrm missing', () => {
    const event = {
      body: JSON.stringify({ newVrm: undefined, isCherishedTransfer: false }),
      pathParameters: { systemNumber: 123456, createdTimestamp: new Date().toISOString() },
      headers: {
        Authorization: mockToken,
      },
    } as unknown as APIGatewayProxyEvent;
    expect(validateUpdateVrmRequest(event)).toEqual({
      statusCode: 400,
      body: 'You must provide a new VRM',
    });
  });
  it('if !isCherishedTransfer returns false if all information provided', () => {
    const event = {
      body: JSON.stringify({ newVrm: '012345', isCherishedTransfer: false }),
      pathParameters: { systemNumber: 123456, createdTimestamp: new Date().toISOString() },
      headers: {
        Authorization: mockToken,
      },
    } as unknown as APIGatewayProxyEvent;
    expect(validateUpdateVrmRequest(event)).toBe(false);
  });
});
