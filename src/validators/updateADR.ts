import { isObjectEmpty } from './emptyObject';
import { formatErrorMessage } from '../util/errorMessage';
import { ERRORS } from '../util/enum';

const receivedDateFormat = /^\d{4}-\d{2}-\d{2}$/;

export const validateUpdateADRErrors = (requestBody: string | null) => {
  if (!requestBody) {
    return { statusCode: 400, body: formatErrorMessage(ERRORS.MISSING_PAYLOAD) };
  }

  const parsedBody = JSON.parse(requestBody) as { adrApproved: boolean; receivedDate: string; applicationNumber: string };
  console.log('Parsed body:', parsedBody);
  if (!parsedBody || isObjectEmpty(parsedBody)) {
    return { statusCode: 400, body: formatErrorMessage(ERRORS.MISSING_PAYLOAD) };
  }

  if (parsedBody.adrApproved === undefined || parsedBody.adrApproved === null) {
    return { statusCode: 400, body: formatErrorMessage('payload missing adrApproved') };
  }

  if (!parsedBody.receivedDate) {
    return { statusCode: 400, body: formatErrorMessage('payload missing receivedDate') };
  }

  if (!parsedBody.applicationNumber) {
    return { statusCode: 400, body: formatErrorMessage('payload missing applicationNumber') };
  }

  if (!receivedDateFormat.test(parsedBody.receivedDate)) {
    return { statusCode: 400, body: formatErrorMessage('Invalid receivedDate provided') };
  }

  const receivedDateObj = new Date(parsedBody.receivedDate);
  if (receivedDateObj > new Date()) {
    return { statusCode: 400, body: formatErrorMessage('receivedDate cannot be in the future') };
  }

  return false;
};
