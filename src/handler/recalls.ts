import { SecretsManager } from '@dvsa/aws-utilities/classes/secrets-manager-client';
import { getProfile } from '@dvsa/cvs-feature-flags/profiles/vtx';
import { EnvironmentVariables } from '@dvsa/cvs-microservice-common/classes/misc/env-vars';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ERRORS } from "../util/enum";
import { formatErrorMessage } from "../util/errorMessage";
import { addHttpHeaders } from "../util/httpHeaders";
import logger from "../util/logger";
import { filterMotRecalls, getBearerToken, getMotRecallsByVin } from '../util/recalls';
import { validateSingleVin } from '../validators/recalls';

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
      if (!validateSingleVin(vin)) {
        logger.error(formatErrorMessage(ERRORS.VIN_ERROR));
        return generalResponse;
      }

      const cachedMotSecret = cache.get('motSecret');
      const motSecret = cachedMotSecret ?? await SecretsManager.get(
        { SecretId: EnvironmentVariables.get("MOT_RECALL_SECRET") },
        {},
        { fromYaml: true }
      );

      console.log(motSecret);

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

      const recalls = await getMotRecallsByVin(vin, cache);

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









