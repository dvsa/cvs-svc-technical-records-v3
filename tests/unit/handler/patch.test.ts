/* eslint-disable import/first */
const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();
const mockSearchByCriteria = jest.fn();

import type { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../src/handler/patch";
import { searchByCriteria } from "../../../src/services/database";

jest.mock("../../../src/services/database.ts", () => ({
  getBySystemNumberAndCreatedTimestamp:
    mockGetBySystemNumberAndCreatedTimestamp,
  searchByCriteria: mockSearchByCriteria,
}));

const headers = { 'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT', 'Access-Control-Allow-Origin': '*' };


describe("Test Patch Lambda Function", () => {
  describe("Error handling", () => {
    let request: any;
    beforeEach(() => {
        request = {
            headers: {
              accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-encoding': 'gzip, deflate, br',
              Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
                'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
              Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
          },
            body: JSON.stringify({
              newVin: "newVin"
            })
          };
      jest.resetAllMocks();
    });
    it("should return an error when given an invalid request", async () => {
      request.headers.Authorization = undefined
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: JSON.stringify({error: "Missing authorization header"}),
        headers
      });
    });
    it("should return an error when VINs are invalid", async () => {
      request.body = JSON.stringify({newVin: "to"});
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValue({
        vin: "testVin",
      });
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: JSON.stringify({error: "New VIN is invalid"}),
        headers
      });
    });
  });
});
