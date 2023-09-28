import { ERRORS } from '../util/enum';

export const checkVinValidity = (currentVin: string, newVin: (string | undefined | null)) => {
  if ((newVin !== undefined && newVin !== null) && newVin !== currentVin) {
    if (newVin.length < 3
      || newVin.length > 21
      || typeof newVin !== 'string'
      || !(/^[0-9a-z]+$/i).test(newVin)
      || newVin.toUpperCase().includes('O')
      || newVin.toUpperCase().includes('I')
      || newVin.toUpperCase().includes('Q')
    ) {
      return ({
        statusCode: 400,
        body: ERRORS.VIN_ERROR,
      });
    }
  }
  return false;
};
