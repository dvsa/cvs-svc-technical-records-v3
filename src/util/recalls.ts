import { MotRecalls, MotSecret } from "../models/motRecalls";
import logger from "./logger";

/**
 * Search retrieved recall data for an active recall then construct return object.
 * @param vehicleRecalls
 * @returns
 */
export const filterMotRecalls = (vehicleRecalls: MotRecalls) => {
    const time = new Date();
    const recall = vehicleRecalls.recalls.find((recall) => {
      if (recall.repairStatus == "NOT_FIXED" && Date.parse(recall.recallCampaignStartDate) < time.getDate()) {
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
    const motSecret = cache.get('motSecret') as MotSecret;
    const bearerToken = cache.get('bearerToken') as string
    const motApiUrl = `${motSecret.apiURL}recalls/${vin}`

    let recallResponse = await fetch(motApiUrl, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "X-API-Key": motSecret.apiKey,
      }
    })
  
    if(recallResponse.status == 403 || recallResponse.status == 401){
      const newBearerToken = await getBearerToken(cache.get('motSecret') as MotSecret);
      
      if(!newBearerToken) {
        return undefined;
      }

      cache.set('bearerToken', newBearerToken)
      recallResponse = await fetch(motApiUrl, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "X-API-Key": motSecret.apiKey,
        }
      });
    }
    logger.debug(JSON.stringify(recallResponse));

    if(recallResponse.status == 200){
      return JSON.parse(recallResponse.body!.toString());
    }
  
    return undefined;
  }
  

  /**
 * Retrieve bearer token from MOT for recall API
 * @param vin - vin is query parameter
 * @returns Promise<BearerToken> - JWT bearer token for recalls
 */
export const getBearerToken = async (motSecret: MotSecret): Promise<string | undefined> => {
  logger.debug('Calling MOT Token')

  const tokenResponse = await fetch(motSecret.accessTokenURL, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    body: `grant_type=client_credentials&client_id=${motSecret.clientID}&client_secret=${motSecret.clientSecret}&scope=${motSecret.scopeURL}`
  });

  if(tokenResponse.body){
    return JSON.parse(tokenResponse.body.toString()).access_token;
  }
  return undefined;
  }
  