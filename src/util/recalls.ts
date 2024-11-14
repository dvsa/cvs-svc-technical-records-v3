import { motRecalls } from "../models/motRecalls";

/**
 * Search retrieved recall data for an active recall then construct return object.
 * @param vehicleRecalls
 * @returns
 */
export const filterMotRecalls = (vehicleRecalls: motRecalls) => {
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
export const getMotRecallsByVin = async (vin: string, cache: Map<string, string | Map<string, string>>): Promise<motRecalls | undefined> => {
    let recallResponse = await fetch(`mot placeholder`, {
      headers: {
        authorization: ""
      }
    })
  
    if(recallResponse.status == 403 || recallResponse.status == 401){
      const newBearerToken = await getBearerToken(cache.get('motSecret') as Map<string, string>);
      cache.set('bearerToken', newBearerToken)
      recallResponse = await fetch(`mot placeholder`, {
        headers: {
          authorization: `Bearer `
        }
      });
    }
  
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
export const getBearerToken = async (motSecret: Map<string, string>): Promise<string> => {
    // TODO: secrets & auth
    console.log(motSecret);
    return 'bearer'
  }
  