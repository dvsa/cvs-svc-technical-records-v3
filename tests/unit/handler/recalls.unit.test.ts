import type {APIGatewayProxyResult} from "aws-lambda";
import { handler } from '../../../src/handler/recalls';
import {motRecalls} from "../../../src/models/motRecalls";
import {APIGatewayProxyEvent} from "aws-lambda/trigger/api-gateway-proxy";
import {ERRORS} from "../../../src/util/enum";

describe("Test Recalls endpoint", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  })
  describe("handler", () => {
    describe("feature flags", () => {
      const mockGetProfile = jest.fn();
      jest.mock('@dvsa/cvs-feature-flags/profiles/vtx', () => ({
        getProfile: mockGetProfile,
      }));
      describe("WHEN the flag is not set", () => {
        it("SHOULD return a 500 response", async () => {
          mockGetProfile.mockResolvedValue({
            someIncorrectFlag: {
              enabled: true,
            },
          });

          const res = await handler({} as APIGatewayProxyEvent);
          expect(res.statusCode).toBe(500);
          expect(res.body).toBe("Recall Feature Flag is undefined")
        });
      });
      describe("WHEN the flag is disabled", () => {
        it("SHOULD return a 200 response with flag disabled message", async () =>{
          mockGetProfile.mockResolvedValue({
            recallsApi: {
              enabled: false,
            },
          });

          const res = await handler({} as APIGatewayProxyEvent);
          expect(res.statusCode).toBe(200);
          expect(res.body).toBe("recall API flag is disabled")
        });
      });
      describe("WHEN the flag is enabled", () => {
        it("SHOULD process normally", async () =>{
          mockGetProfile.mockResolvedValue({
            recallsApi: {
              enabled: true,
            },
          });
          const res = await handler({} as APIGatewayProxyEvent);
          expect(res.statusCode).toBe(200);
        });
      });
    });
  });
  describe("vin validation", () => {
    it('SHOULD return 400 response with a VIN_ERROR when given an INVALID VIN',async () => {
      const res = await handler({pathParameters: {vin: "invalid_Vin"}} as unknown as APIGatewayProxyEvent);

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual(ERRORS.VIN_ERROR);
    });
    it('SHOULD return 200 response',async () => {
      const res = await handler({pathParameters: {vin: "invalid_Vin"}} as unknown as APIGatewayProxyEvent);

      //TODO: happy path VIN validation test
    });
  });
  describe("MOT API connection", async () => {

  });
  describe("Constructing return object", () => {
    const mockMotRecall : motRecalls = {
      vin: "",
      manufacturer: "audi",
      recalls:
      [
        {
          manufacturerCampaignReference: "test",
          dvsaCampaignReference: "test",
          recallCampaignStartDate: "test",
          repairStatus: "NOT_FIXED"
        }
      ],
      lastUpdatedDate: (new Date()).toISOString()
    }
    it("", () => {

    });
  });
});
