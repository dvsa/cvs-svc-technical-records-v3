import { APIGatewayProxyEvent } from 'aws-lambda';
import { ERRORS, StatusCode } from '../../../src/util/enum';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { checkStatusCodeValidity, validateUpdateErrors, validateUpdateVrmRequest } from '../../../src/validators/update';
import { mockToken } from '../util/mockToken';

const trlPayload = {
  techRecord_vehicleConfiguration: 'other',
  techRecord_reasonForCreation: 'Test Update',
  techRecord_approvalType: 'NTA',
  techRecord_statusCode: 'provisional',
  techRecord_vehicleClass_code: 't',
  techRecord_vehicleClass_description: 'trailer',
  techRecord_vehicleType: 'trl',
  techRecord_bodyType_description: 'artic',
  techRecord_bodyType_code: 'a',
  trailerId: 'C530005',
  vin: '9080977997',
};

describe('validateUpdateErrors', () => {
  it('throws error if request body is empty', () => {
    expect(validateUpdateErrors('{}')).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.MISSING_PAYLOAD),
    });
  });
  it('returns false if no errors', () => {
    const event = { body: JSON.stringify(trlPayload) } as unknown as APIGatewayProxyEvent;

    const res = validateUpdateErrors(event.body);

    expect(res).toBe(false);
  });
});

describe('checkStatusCodeValidity', () => {
  it('throws error if trying to update archived record', () => {
    expect(checkStatusCodeValidity(StatusCode.ARCHIVED)).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.CANNOT_UPDATE_ARCHIVED_RECORD),
    });
  });
  it('throws error if trying to archive a record', () => {
    expect(checkStatusCodeValidity(undefined, StatusCode.ARCHIVED)).toEqual({
      statusCode: 400,
      body: formatErrorMessage(ERRORS.CANNOT_USE_UPDATE_TO_ARCHIVE),
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
      headers: {
        Authorization: mockToken,
      },
    } as unknown as APIGatewayProxyEvent;
    expect(validateUpdateVrmRequest(event)).toEqual({
      statusCode: 400,
      body: formatErrorMessage('invalid request'),
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
      body: formatErrorMessage('Missing authorization header'),
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
      body: formatErrorMessage('You must provide a new VRM'),
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
      body: formatErrorMessage('You must provide a new VRM'),
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
