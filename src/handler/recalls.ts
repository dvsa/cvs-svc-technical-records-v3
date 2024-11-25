import { SecretsManager } from '@dvsa/aws-utilities/classes/secrets-manager-client';
import { getProfile } from '@dvsa/cvs-feature-flags/profiles/vtx';
import { EnvironmentVariables } from '@dvsa/cvs-microservice-common/classes/misc/env-vars';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MotSecret } from '../models/motRecalls';
import { formatErrorMessage } from '../util/errorMessage';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import {
  filterMotRecalls, getBearerToken, getMotRecallsByVin,
} from '../util/recalls';
import { validateSingleVin } from '../validators/recalls';

const cache: Map<string, (string | MotSecret)> = new Map();
const defaultResponse = addHttpHeaders({
  statusCode: 200,
  body: JSON.stringify({
    manufacturer: null,
    hasRecall: false,
  }),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Recalls end point called');
  try {
    const featureFlags = await getProfile();

    if (!featureFlags.recallsApi) {
      logger.error('Recall Feature Flag is undefined');
      return addHttpHeaders({
        statusCode: 500,
        body: 'Recall Feature Flag is undefined',
      });
    }

    if (!featureFlags.recallsApi.enabled) {
      logger.warn('Flag disabled: please enable for recalls functionality');
      return defaultResponse;
    }

    const vin: string = decodeURIComponent(event.pathParameters?.vin as string);
    if (!validateSingleVin(vin)) {
      logger.error(formatErrorMessage('VIN provided in path parameter is not valid.'));
      return defaultResponse;
    }

    const cachedMotSecret = cache.get('motSecret') as MotSecret;
    const motSecret = cachedMotSecret ?? await SecretsManager.get(
      { SecretId: EnvironmentVariables.get('MOT_RECALL_SECRET') },
      {},
      { fromYaml: true },
    );

    if (!cache.has('motSecret')) {
      cache.set('motSecret', motSecret);
    }

    const cachedBearerToken = cache.get('bearerToken');
    const bearerToken = cachedBearerToken ?? await getBearerToken(motSecret);

    if (!bearerToken) {
      logger.error('bearer token not found');
      return defaultResponse;
    }

    if (!cache.has('bearerToken')) {
      cache.set('bearerToken', bearerToken);
    }

    const recalls = await getMotRecallsByVin(vin, cache, motSecret);

    if (!recalls) {
      return defaultResponse;
    }

    const recallsResponse = filterMotRecalls(recalls);

    logger.debug(`Final response: ${JSON.stringify(recallsResponse)}`);
    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(recallsResponse),
    });
  } catch (err) {
    console.error(err);
    return addHttpHeaders({
      statusCode: 500,
      body: 'Error calling recalls API',
    });
  }
};
