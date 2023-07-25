import 'dotenv/config';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../util/logger';
import { SearchCriteria } from '../models/search';
import { searchByAll, searchByCriteria } from '../services/database';
import { validateSearchErrors } from '../validators/search';
import { addHttpHeaders } from '../util/httpHeaders';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Search end point called');

  const searchErrors = validateSearchErrors(event);
  if (searchErrors) {
    return addHttpHeaders(searchErrors);
  }

  const searchCriteria: SearchCriteria = event.queryStringParameters?.searchCriteria as SearchCriteria ?? SearchCriteria.ALL;
  const searchIdentifier: string = decodeURIComponent(event.pathParameters?.searchIdentifier as string).toUpperCase();
  logger.info(`Search database with identifier ${searchIdentifier} and criteria ${searchCriteria}`);

  const searchResult = searchCriteria === SearchCriteria.ALL
    ? await searchByAll(searchIdentifier) : await searchByCriteria(searchCriteria, searchIdentifier);

  logger.debug(JSON.stringify(searchResult));

  if (!searchResult.length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No records found matching identifier ${searchIdentifier} and criteria ${searchCriteria}`,
    });
  }

  return addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify(searchResult),
  });
};
