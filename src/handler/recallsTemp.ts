import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { addHttpHeaders } from "../util/httpHeaders";
import logger from "../util/logger";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Recalls end point called');
  
    const vin: string = decodeURIComponent(event.pathParameters?.vin as string);
    const time = new Date();

    const returnValue = vin + ' - ' + time.toISOString();

    return addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify(returnValue),
    });
  };