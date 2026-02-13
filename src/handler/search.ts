import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'dotenv/config';
import { SearchCriteria } from '../models/search';
import { searchByAll, searchByCriteria } from '../services/database';
import { formatErrorMessage } from '../util/errorMessage';
import { addHttpHeaders } from '../util/httpHeaders';
import logger from '../util/logger';
import { validateSearchErrors } from '../validators/search';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Search end point called');

  const searchErrors = validateSearchErrors(event);
  if (searchErrors) {
    return addHttpHeaders(searchErrors);
  }

  const searchCriteria: SearchCriteria = event.queryStringParameters?.searchCriteria as SearchCriteria ?? SearchCriteria.ALL;
  const additionalInfo = event.queryStringParameters?.additionalInfo === 'true';
  const removeArchived = event.queryStringParameters?.removeArchived === 'true';
  const searchIdentifier: string = decodeURIComponent(event.pathParameters?.searchIdentifier as string).toUpperCase();

  logger.info(`Search database with identifier ${searchIdentifier} and criteria ${searchCriteria} (w/ removeArchived: ${removeArchived}`);

  let searchResult = searchCriteria === SearchCriteria.ALL
    ? await searchByAll(searchIdentifier)
    : await searchByCriteria(searchCriteria, searchIdentifier);

  logger.debug(JSON.stringify(searchResult));

  if (!searchResult.length) {
    return addHttpHeaders({
      statusCode: 404,
      body: formatErrorMessage(`No records found matching identifier ${searchIdentifier} and criteria ${searchCriteria}`),
    });
  }

  if (removeArchived) {
    logger.info('Removing archived records from search results');
    searchResult = searchResult.filter((record) => record.techRecord_statusCode !== 'archived');
  }

  if (!additionalInfo) {
    logger.info('Removing additional info from search results');
    searchResult = searchResult.map(({ techRecord_applicantDetails_emailAddress, ...filteredResult }) => filteredResult);
  }

  return addHttpHeaders({
    statusCode: 200,
    body: JSON.stringify(searchResult),
  });
};
