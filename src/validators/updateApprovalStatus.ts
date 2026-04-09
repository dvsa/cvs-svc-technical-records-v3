import { isObjectEmpty } from './emptyObject';
import { formatErrorMessage } from '../util/errorMessage';
import { ERRORS } from '../util/enum';

const receivedDateFormat = /^\\d{4}-\\d{2}-\\d{2}$/;

export const validateUpdateApprovalStatusErrors = (requestBody: string | null) => {
  if (!requestBody) {
    return { statusCode: 400, body: formatErrorMessage(ERRORS.MISSING_PAYLOAD) };
  }

  const parsedBody = JSON.parse(requestBody) as { adrComplete: boolean | undefined; receivedDate: string | undefined; };
  if (!parsedBody || isObjectEmpty(parsedBody)) {
    return { statusCode: 400, body: formatErrorMessage(ERRORS.MISSING_PAYLOAD) };
  }

  if (typeof parsedBody.adrComplete !== 'boolean') {
    return { statusCode: 400, body: formatErrorMessage('adrComplete must be a boolean') };
  }

  if (typeof parsedBody.receivedDate !== 'string' || !receivedDateFormat.test(parsedBody.receivedDate)) {
    return { statusCode: 400, body: formatErrorMessage('Invalid receivedDate provided') };
  }

  return false;
};
