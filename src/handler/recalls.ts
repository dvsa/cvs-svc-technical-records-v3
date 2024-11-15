import { getProfile } from '@dvsa/cvs-feature-flags/profiles/vtx';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { MotSecret } from '../models/motRecalls';
import { ERRORS } from "../util/enum";
import { formatErrorMessage } from "../util/errorMessage";
import { addHttpHeaders } from "../util/httpHeaders";
import logger from "../util/logger";
import { filterMotRecalls, getBearerToken, getMotRecallsByVin } from '../util/recalls';
import { validateSingleVin } from '../validators/recalls';

const cache: Map<string, string | MotSecret> = new Map();

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
      const motSecret = cachedMotSecret ?? {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        scopeURL: process.env.SCOPE_URL,
        accessTokenURL: process.env.ACCESS_TOKEN_URL,
        apiKey: process.env.API_KEY,
        apiURL: process.env.API_URL,
      }

      if(!motSecret) {
        logger.error('no secrets found')
        return generalResponse;
      }

      if (!cache.has('motSecret')) {
        cache.set('motSecret', motSecret as any);
      }

      const cachedBearerToken = cache.get('bearerToken');
      const bearerToken = cachedBearerToken ?? await getBearerToken(motSecret as MotSecret);

      if(!bearerToken) {
        logger.error('bearer token not found')
        return generalResponse;
      }

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
      console.error(err);
      return addHttpHeaders({
        statusCode: 500,
        body: err.message
      })
    }
  };









