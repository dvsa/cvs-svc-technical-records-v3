import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SearchCriteria } from '../models/search';
import { formatErrorMessage } from '../util/errorMessage';

// eslint-disable-next-line consistent-return
export const validateSearchErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  if (!event.pathParameters?.searchIdentifier) {
    return {
      statusCode: 400,
      body: formatErrorMessage('Missing vehicle search identifier'),
    };
  }
  const searchCriteria = event.queryStringParameters?.searchCriteria;
  if (searchCriteria && !Object.values(SearchCriteria).includes(searchCriteria as SearchCriteria)) {
    return {
      statusCode: 400,
      body: formatErrorMessage('Invalid search criteria'),
    };
  }

  const searchIdentifier: string = decodeURIComponent(event.pathParameters.searchIdentifier);
  if (searchIdentifier.length < 3 || searchIdentifier.length > 21) {
    return {
      statusCode: 400,
      body: formatErrorMessage('The search identifier must be between 3 and 21 characters.'),
    };
  }
};
