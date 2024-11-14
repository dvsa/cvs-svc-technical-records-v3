import { SecretsManager } from '@dvsa/aws-utilities/classes/secrets-manager-client';
import { getProfile } from '@dvsa/cvs-feature-flags/profiles/vtx';
import { EnvironmentVariables } from '@dvsa/cvs-microservice-common/classes/misc/env-vars';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { motRecalls } from "../models/motRecalls";
import { ERRORS } from "../util/enum";
import { formatErrorMessage } from "../util/errorMessage";
import { addHttpHeaders } from "../util/httpHeaders";
import logger from "../util/logger";

const cache: Map<string, string | Map<string, string>> = new Map();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Recalls end point called');
    try {
      const generalResponse = addHttpHeaders({
        statusCode: 200,
        body: JSON.stringify({
          manufacturer: null,
          hasRecall: false
        })
      });

      const featureFlags = await getProfile();

      if(!featureFlags.recallsApi){
        logger.error("Recall Feature Flag is undefined")
        return addHttpHeaders( {
          statusCode: 500,
          body: "Recall Feature Flag is undefined"
        });
      }

      if(!featureFlags.recallsApi.enabled){
        logger.warn('Flag disabled: please enable for recalls functionality');
        return generalResponse;
      }

      const vin: string = decodeURIComponent(event.pathParameters?.vin as string);
      if (!validateVin(vin)) {
        logger.error(formatErrorMessage(ERRORS.VIN_ERROR));
        return generalResponse;
      }

      const cachedMotSecret = cache.get('motSecret');
      const motSecret = cachedMotSecret ?? await SecretsManager.get(
        { SecretId: EnvironmentVariables.get("MOT_RECALL_SECRET") },
        {},
        { fromYaml: true }
      );

      if(!motSecret) {
        logger.error('no secrets found')
        return generalResponse;
      }

      if (!cache.has('motSecret')) {
        cache.set('motSecret', motSecret as any);
      }

      const cachedBearerToken = cache.get('bearerToken');
      const bearerToken = cachedBearerToken ?? await getBearerToken(motSecret as Map<string, string>);

      if (!cache.has('bearerToken')) {
        cache.set('bearerToken', bearerToken);
      }

      const recalls = await getMotRecallsByVin(vin, bearerToken as string, motSecret as Map<string, string>);

      if(!recalls){
        return generalResponse;
      }

      const recallsResponse = filterMotRecalls(recalls);

      return addHttpHeaders({
        statusCode: 200,
        body: JSON.stringify(recallsResponse),
      });

    } catch (err: any) {
      return addHttpHeaders({
        statusCode: 500,
        body: err.message
      })
    }
  };

/**
 * Retrieve bearer token from MOT for recall API
 * @param vin - vin is query parameter
 * @returns Promise<BearerToken> - JWT bearer token for recalls
 */
const getBearerToken = async (motSecret: Map<string, string>): Promise<string> => {
  // TODO: secrets & auth
  console.log(motSecret);
  return 'bearer'
}


/**
 * Retrieve vehicle recall data from MOT recall API
 * @param vin - vin is query parameter
 * @returns Promise<motRecalls> - vehicle recall information
 */
const getMotRecallsByVin = async (vin: string, bearerToken: string, motSecret: Map<string, string>): Promise<motRecalls | undefined> => {
  let recallResponse = await fetch(`mot placeholder`, {
    headers: {
      authorization: ""
    }
  })

  if(recallResponse.status == 403 || recallResponse.status == 401){
    const newBearerToken = await getBearerToken(motSecret);
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
 * Search retrieved recall data for an active recall then construct return object.
 * @param vehicleRecalls
 * @returns
 */
const filterMotRecalls = (vehicleRecalls: motRecalls) => {
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
 * validate the input vin has a valid format
 * @param vin - query param
 * @returns boolean - valid/invalid format
 */
const validateVin = (vin : any) => {
  if (vin !== undefined && vin !== null) {
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
  }
  return true;
}
