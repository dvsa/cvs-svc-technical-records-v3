import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SearchCriteria } from '../models/search';

// eslint-disable-next-line consistent-return
export const getSearchErrors = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  if (!event.pathParameters?.searchIdentifier) {
    return {
      statusCode: 400,
      body: 'Missing vehicle search identifier',
    };
  }
  const searchCriteria = event.queryStringParameters?.searchCriteria;
  if (searchCriteria && !Object.values(SearchCriteria).includes(searchCriteria as SearchCriteria)) {
    return {
      statusCode: 400,
      body: 'Invalid search criteria',
    };
  }

  const searchIdentifier: string = decodeURIComponent(event.pathParameters.searchIdentifier);
  if (searchIdentifier.length < 3 || searchIdentifier.length > 21) {
    return {
      statusCode: 400,
      body: 'The search identifier should be between 3 and 21 characters.',
    };
  }
};
