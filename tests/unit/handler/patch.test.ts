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

const headers = {
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
  "Access-Control-Allow-Origin": "*",
};

describe("Test Patch Lambda Function", () => {
  describe("Error handling", () => {
    let request: any;
    beforeEach(() => {
        request = {
            body: JSON.stringify({
              msUserDetails: "user",
              newVin: "newVin",
              createdTimestamp: "20-21",
              systemNumber: "system",
            })
          };
    });
    it("should return an error when given an invalid request", async () => {
      delete request.msUserDetails;
      const result = await handler(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "Microsoft user details not provided",
        headers,
      });
    });
    it("should return an error when VINs are invalid", async () => {
      request.newVin = "to";
      mockGetBySystemNumberAndCreatedTimestamp.mockReturnValue({
        vin: "testVin",
      });
      const result = await handler({
        body: JSON.stringify(request),
      } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "New VIN is invalid",
        headers,
      });
    });
  });
});
