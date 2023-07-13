/* eslint-disable import/first */
const mockSearchByCriteria = jest.fn();

import type { APIGatewayProxyEvent } from "aws-lambda";
import {
  validateUpdateVinRequest,
  validateVins,
} from "../../../src/validators/patch";

const headers = {
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
  "Access-Control-Allow-Origin": "*",
};

jest.mock("../../../src/services/database.ts", () => ({
  searchByCriteria: mockSearchByCriteria,
}));

describe("Test updateVin Validators", () => {
  describe("validateUpdateVinRequest", () => {
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
    it("should return an error when missing a request body", () => {
      const result = validateUpdateVinRequest(
        {} as unknown as APIGatewayProxyEvent
      );
      expect(result).toEqual({
        statusCode: 400,
        body: "invalid request",
        headers,
      });
    });
    it("should return an error when missing the new VIN", () => {
      delete request.newVin;
      const result = validateUpdateVinRequest(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "You must provide a new VIN",
        headers,
      });
    });
    it("should return an error when missing the msUserDetails", () => {
      const result = validateUpdateVinRequest(request as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "Microsoft user details not provided",
        headers,
      });
    });
  });

  describe("validateVins", () => {
    it("should return an error if new VIN is shorter than 3 characters", () => {
      const result = validateVins("oldvin", "to");
      expect(result).toEqual({
        statusCode: 400,
        body: "New VIN is invalid",
        headers,
      });
    });
    it("should return an error if new VIN is longer than 21 characters", () => {
      const result = validateVins("oldvin", "tototototototototototo");
      expect(result).toEqual({
        statusCode: 400,
        body: "New VIN is invalid",
        headers,
      });
    });
    it("should return an error if new VIN is the same as the old VIN", () => {
      const result = validateVins("samevin", "samevin");
      expect(result).toEqual({
        statusCode: 400,
        body: "New VIN must be different to the current VIN",
        headers,
      });
    });
  });
});
