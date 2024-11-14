import { SecretsManager } from '@dvsa/aws-utilities/classes/secrets-manager-client';
import { getProfile } from '@dvsa/cvs-feature-flags/profiles/vtx';
import { EnvironmentVariables } from '@dvsa/cvs-microservice-common/classes/misc/env-vars';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { env } from "process";
import { motRecalls } from "../models/motRecalls";
import { recallSecret } from "../models/recallSecret";
import { ERRORS } from "../util/enum";
import { formatErrorMessage } from "../util/errorMessage";
import { addHttpHeaders } from "../util/httpHeaders";
import logger from "../util/logger";

const cache: Map<string, Map<string, string>> = new Map();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Recalls end point called');
    try {
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
        return addHttpHeaders( {
          statusCode: 200,
          body: JSON.stringify({
            manufacturer: null,
            hasRecall: false
          })
        });
      }

      const vin: string = decodeURIComponent(event.pathParameters?.vin as string);
      if (!validateVin(vin)) {
        logger.error(formatErrorMessage(ERRORS.VIN_ERROR));
        return addHttpHeaders({
          statusCode: 200,
          body: JSON.stringify({
            manufacturer: null,
            hasRecall: false
          })
        });
      }

      const recalls: motRecalls = await getMotRecallsByVin(vin);
      const recallsResponse = filterMotRecalls(recalls);

      return addHttpHeaders({
        statusCode: 200,
        body: JSON.stringify(recallsResponse),
      });

    } catch (err : any) {
      return addHttpHeaders({
        statusCode: 500,
        body: err.message
      })
    }
  };

/**
 * Retrieve vehicle recall data from MOT recall API
 * @param vin - vin is query parameter
 * @returns Promise<motRecalls> - vehicle recall information
 */
const getMotRecallsByVin = async (vin: string): Promise<motRecalls> => {
  // TODO: secrets & auth
  const secretResult: recallSecret = await SecretsManager.get(
    { SecretId: EnvironmentVariables.get("MOT_RECALL_SECRET") },
    {},
    { fromYaml: true }
  );

  // check cache, get token if empty, cache it


  return await fetch(`mot placeholder`, {
    headers: {
      authorization: ""
    }
  }) as unknown as motRecalls;
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
