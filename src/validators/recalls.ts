/**
 * validate the input vin has a valid format
 * @param vin - query param
 * @returns boolean - valid/invalid format
 */
export const validateSingleVin = (vin: string) => {
    if (vin) {
      if (vin.length < 3
        || vin.length > 21
        || typeof vin !== 'string'
        || !(/^[0-9a-z]+$/i).test(vin)
        || vin.toUpperCase().includes('O')
        || vin.toUpperCase().includes('I')
        || vin.toUpperCase().includes('Q')
      ) {
        return false;
      }
    } else {
        return false;
    }
    return true;
  }