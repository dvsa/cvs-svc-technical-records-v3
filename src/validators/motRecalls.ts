import { getProfile } from '@dvsa/cvs-feature-flags/profiles/vtx';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';

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
};

export const validateFeatureFlags = async () => {
  logger.debug('validating the mot recalls feature flags');
  const featureFlags = await getProfile();

  if (!featureFlags?.recallsApi) {
    logger.error('Recall Feature Flag is undefined');
    return addHttpHeaders({
      statusCode: 500,
      body: 'Recall Feature Flag is undefined',
    });
  }

  if (!featureFlags.recallsApi?.enabled) {
    logger.warn('Flag disabled: please enable for recalls functionality');
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify({
        manufacturer: null,
        hasRecall: false,
      }),
    });
  }

  return undefined;
};
