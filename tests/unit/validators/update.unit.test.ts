import { APIGatewayProxyEvent } from 'aws-lambda';
import { ERRORS, StatusCode } from '../../../src/util/enum';
import { formatErrorMessage } from '../../../src/util/errorMessage';
import { checkStatusCodeValidity, validateUpdateErrors } from '../../../src/validators/update';

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
