import 'dotenv/config';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { ISearchCriteria, SEARCHCRITERIA } from '../models/ISearchCriteria';
import { searchByAll, searchByCriteria } from '../services/database';

// eslint-disable-next-line @typescript-eslint/require-await
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Search end point called');

  if (!event.pathParameters) {
    return {
      statusCode: 400,
      body: 'Missing vehicle search identifier',
    };
  }

  const searchCriteria: ISearchCriteria = (event.queryStringParameters?.searchCriteria)
    ? event.queryStringParameters.searchCriteria as ISearchCriteria : SEARCHCRITERIA.ALL;
  const searchIdentifier: string | null = (event.pathParameters) ? decodeURIComponent(event.pathParameters.searchIdentifier ?? '') : null;

  // searchTerm too long or too short
  if (!searchIdentifier || searchIdentifier.length < 3 || searchIdentifier.length > 21) {
    return {
      statusCode: 400,
      body: 'The search identifier should be between 3 and 21 characters.',
    };
  }

  logger.info(`Search database with identifier ${searchIdentifier} and criteria ${searchCriteria}`);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const searchResult = searchCriteria === SEARCHCRITERIA.ALL
    ? await searchByAll(searchIdentifier) : await searchByCriteria(searchCriteria, searchIdentifier);

  logger.debug(JSON.stringify(searchResult));

  if (!searchResult || searchResult.length === 0) {
    return {
      statusCode: 404,
      body: `Nothing matched search with identifier ${searchIdentifier} and criteria ${searchCriteria}`,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(searchResult),
  };
};
