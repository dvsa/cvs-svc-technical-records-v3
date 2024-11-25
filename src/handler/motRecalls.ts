import { SecretsManager } from '@dvsa/aws-utilities/classes/secrets-manager-client';
import { EnvironmentVariables } from '@dvsa/cvs-microservice-common/classes/misc/env-vars';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MotSecret } from '../models/motRecalls';
import { formatErrorMessage } from '../util/errorMessage';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import {
  filterMotRecalls, getBearerToken, getMotRecallsByVin,
} from '../util/motRecalls';
import { validateFeatureFlags, validateSingleVin } from '../validators/motRecalls';

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
    const validateFeatureFlagsRecalls = await validateFeatureFlags();
    if (validateFeatureFlagsRecalls) {
      return validateFeatureFlagsRecalls;
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
