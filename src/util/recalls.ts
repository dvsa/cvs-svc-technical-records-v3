import { MotRecalls, MotSecret } from "../models/motRecalls";
import logger from "./logger";

/**
 * Search retrieved recall data for an active recall then construct return object.
 * @param vehicleRecalls
 * @returns
 */
export const filterMotRecalls = (vehicleRecalls: MotRecalls) => {
  const recall = vehicleRecalls.recalls.find((recall) => {
    if (recall.repairStatus == "NOT_FIXED" && Date.parse(recall.recallCampaignStartDate) < Date.now()) {
      return recall;
    }
  });
  return {
    manufacturer: recall ? vehicleRecalls.manufacturer : null,
    hasRecall: !!recall,
  }
}

/**
 * Retrieve vehicle recall data from MOT recall API
 * @param vin - vin is query parameter
 * @returns Promise<motRecalls> - vehicle recall information
 */
export const getMotRecallsByVin = async (vin: string, cache: Map<string, string | MotSecret>): Promise<MotRecalls | undefined> => {
  logger.debug('Calling MOT Recalls')
  try {
    const motSecret = cache.get('motSecret') as MotSecret;
    const bearerToken = cache.get('bearerToken') as string
    const motApiUrl = `${motSecret.apiURL}recalls/${vin}`

    let recallResponse = await fetch(motApiUrl, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "X-API-Key": motSecret.apiKey,
      }
    })

    logger.debug(`first recall response: ${JSON.stringify(recallResponse)}`);
  
    if(recallResponse.status == 403 || recallResponse.status == 401) {
      const newBearerToken = await getBearerToken(motSecret);
      if(!newBearerToken) {
        return undefined;
      }
      logger.debug('got a new bearer token');

      cache.set('bearerToken', newBearerToken)
      recallResponse = await fetch(motApiUrl, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "X-API-Key": motSecret.apiKey,
        }
      });
      logger.debug(`second recall response if called: ${JSON.stringify(recallResponse)}`);
    }

    return await recallResponse.json()
  } catch (err) {
    console.error(`failed calling MOT endpoint: ${err}`)
    return undefined;
  };
}
  

  /**
 * Retrieve bearer token from MOT for recall API
 * @param vin - vin is query parameter
 * @returns Promise<BearerToken> - JWT bearer token for recalls
 */
export const getBearerToken = async (motSecret: MotSecret): Promise<string | undefined> => {
  logger.debug('Calling MOT Token')

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", motSecret.clientID);
  params.append("client_secret", motSecret.clientSecret);
  params.append("scope", motSecret.scopeURL);

  try {
    const tokenResponse = await fetch(motSecret.accessTokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const body = await tokenResponse.json()
    return body.access_token
  } catch (err) {
    logger.error(`Failed to get bearer token: ${err}`)
    return undefined;
  }
}
