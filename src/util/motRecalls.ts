import { RecallsSchema } from '@dvsa/cvs-type-definitions/types/v1/recalls';
import { BearerResponse, MotRecalls, MotSecret } from '../models/motRecalls';
import logger from './logger';

/**
 * Search retrieved recall data for an active recall then construct return object.
 * @param vehicleRecalls
 * @returns
 */
export const filterMotRecalls = (vehicleRecalls: MotRecalls): RecallsSchema => {
  logger.debug('Filter Recall Response');
  const foundRecall = vehicleRecalls.recalls.find((recall) => {
    if (recall.repairStatus === 'NOT_FIXED' && Date.parse(recall.recallCampaignStartDate) < Date.now()) {
      return recall;
    }
    return false;
  });
  return {
    manufacturer: foundRecall ? vehicleRecalls.manufacturer : null,
    hasRecall: !!foundRecall,
  };
};

/**
 * Retrieve vehicle recall data from MOT recall API
 * @param vin - vin is query parameter
 * @param cache - the stored cache with string or mot secret
 * @param motSecret - mot secret
 * @returns Promise<motRecalls> - vehicle recall information
 */
export const getMotRecallsByVin = async (vin: string, cache: Map<string, (string | MotSecret)>, motSecret: MotSecret):
Promise<MotRecalls | undefined> => {
  logger.debug('Calling MOT Recalls');

  try {
    const bearerToken = cache.get('bearerToken') as string;
    const motApiUrl = `${motSecret.apiURL}/${vin}`;

    let recallResponse = await fetch(motApiUrl, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'x-api-key': motSecret.apiKey,
      },
    });

    let parsedRecallResponse = await recallResponse.json() as MotRecalls;

    logger.debug(`first recall status code: ${recallResponse.status}`);
    logger.debug(`first recall response: ${JSON.stringify(parsedRecallResponse)}`);

    if (recallResponse.status === 403 || recallResponse.status === 401) {
      const newBearerToken = await getBearerToken(motSecret);
      if (!newBearerToken) {
        return undefined;
      }
      logger.debug('got a new bearer token');

      cache.set('bearerToken', newBearerToken);
      recallResponse = await fetch(motApiUrl, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'x-api-key': motSecret.apiKey,
        },
      });

      parsedRecallResponse = await recallResponse.json() as MotRecalls;

      logger.debug(`second recall status code: ${recallResponse.status}`);
      logger.debug(`second recall response: ${JSON.stringify(parsedRecallResponse)}`);
    }

    if (recallResponse.status === 200) {
      return parsedRecallResponse;
    }

    return undefined;
  } catch (err) {
    logger.error(`failed calling MOT endpoint: Error: ${(err as Error).message}`);
    return undefined;
  }
};

/**
 * Retrieve bearer token from MOT for recall API
 * @param motSecret - the mot secret details
 * @returns Promise<BearerToken> - JWT bearer token for recalls
 */
export const getBearerToken = async (motSecret: MotSecret): Promise<string | undefined> => {
  logger.debug('Calling MOT Token');

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', motSecret.clientID);
  params.append('client_secret', motSecret.clientSecret);
  params.append('scope', motSecret.scopeURL);

  try {
    const tokenResponse = await fetch(motSecret.accessTokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const body = await tokenResponse.json() as BearerResponse;
    return body.access_token;
  } catch (err) {
    logger.error(`Failed to get bearer token: Error: ${(err as Error).message}`);
    return undefined;
  }
};
