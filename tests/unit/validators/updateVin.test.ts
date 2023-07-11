/* eslint-disable import/first */
const mockSearchByCriteria = jest.fn()


import type { APIGatewayProxyEvent } from "aws-lambda";
import {
  validateNewVinNotInUse,
  validateUpdateVinRequest,
  validateVins,
} from "../../../src/validators/updateVin";

const headers = {
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
  "Access-Control-Allow-Origin": "*",
};

jest.mock('../../../src/services/database.ts', () => ({
  searchByCriteria: mockSearchByCriteria,
}));

describe("Test updateVin Validators", () => {
  describe("validateUpdateVinRequest", () => {
    let requestBody: any;
    beforeEach(() => {
      requestBody = {
        msUserDetails: "user",
        newVin: "newVin",
        createdTimestamp: "20-21",
        systemNumber: "system",
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
    it("should return an error when missing the system number", () => {
      delete requestBody.systemNumber;
      const result = validateUpdateVinRequest({
        body: JSON.stringify(requestBody),
      } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "You must provide a System Number",
        headers,
      });
    });
    it("should return an error when missing the new VIN", () => {
      delete requestBody.newVin;
      const result = validateUpdateVinRequest({
        body: JSON.stringify(requestBody),
      } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "You must provide a new VIN",
        headers,
      });
    });
    it("should return an error when missing the msUserDetails", () => {
      delete requestBody.msUserDetails;
      const result = validateUpdateVinRequest({
        body: JSON.stringify(requestBody),
      } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "Microsoft user details not provided",
        headers,
      });
    });
    it("should return an error when missing the vin", () => {
      delete requestBody.createdTimestamp;
      const result = validateUpdateVinRequest({
        body: JSON.stringify(requestBody),
      } as unknown as APIGatewayProxyEvent);
      expect(result).toEqual({
        statusCode: 400,
        body: "You must provide a createdTimestamp",
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

  describe("validateNewVinNotInUse", () => {
    it("returns true if the VIN is not in use", async () => {
      mockSearchByCriteria.mockReturnValue([])
      const result = await validateNewVinNotInUse('newVin')

      expect(result).toBe(true)
    })
    it("returns false if the VIN is in use on a current record", async () => {
      mockSearchByCriteria.mockReturnValue([{statusCode: 'current'}])
      const result = await validateNewVinNotInUse('newVin')

      expect(result).toBe(false)
    })
    it("returns false if the VIN is in use on a current record and has archived records included in array", async () => {
      mockSearchByCriteria.mockReturnValue([{statusCode: 'archived'}, {statusCode: 'archived'}, {statusCode: 'archived'}, {statusCode: 'current'}])
      const result = await validateNewVinNotInUse('newVin')

      expect(result).toBe(false)
    })
    it("returns true if the VIN is in use on an archived record", async () => {
      mockSearchByCriteria.mockReturnValue([{statusCode: 'archived'}])
      const result = await validateNewVinNotInUse('newVin')

      expect(result).toBe(true)
    })
    it("returns true if the VIN is in use on multiple archived records", async () => {
      mockSearchByCriteria.mockReturnValue([{statusCode: 'archived'}, {statusCode: 'archived'}, {statusCode: 'archived'}, {statusCode: 'archived'}])
      const result = await validateNewVinNotInUse('newVin')

      expect(result).toBe(true)
    })
  })
});
