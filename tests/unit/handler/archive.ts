// /* eslint-disable import/first */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */

// const mockArchiveRecord = jest.fn();
// const mockGetBySystemNumberAndCreatedTimestamp = jest.fn();

// jest.mock('../../../src/services/database.ts', () => ({
//   mockArchiveRecord: mockArchiveRecord,
// }));

// jest.mock('../../../src/services/database.ts', () => ({
//   mockGetBySystemNumberAndCreatedTimestamp: mockGetBySystemNumberAndCreatedTimestamp,
// }));

// import type { APIGatewayProxyEvent } from 'aws-lambda';
// import { handler } from '../../../src/handler/archive';
// import archivePatchData from '../../resources/techRecordArchivePatch.json';

// describe('Test Post Lambda Function', () => {
//   beforeEach(() => {
//     jest.resetAllMocks();
//     jest.resetModules();
//   });

//   describe('Successful Response', () => {
//     it('should pass validation and return a 200 response', async () => {
//       const event = {
//         resource: '/',
//         path: '/',
//         httpMethod: 'PATCH',
//         requestContext: {
//           resourcePath: '/',
//           httpMethod: 'PATCH',
//           path: '/admin/',
//         },
//         headers: {
//           accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
//           'accept-encoding': 'gzip, deflate, br',
//           Host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
//           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
//           'X-Amzn-Trace-Id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
//           Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQ0RFRiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0aWQiOiIxMjM0NTYiLCJvaWQiOiIxMjMxMjMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiSm9obiIsInVwbiI6IjEyMzIxMyJ9.R3Fy5ptj-7VIxxw35tc9V1BuybDosP2IksPCK7MRemw',
//         },
//         multiValueHeaders: {
//           accept: [
//             'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
//           ],
//           'accept-encoding': [
//             'gzip, deflate, br',
//           ],
//         },
//         queryStringParameters: null,
//         multiValueQueryStringParameters: null,
//         pathParameters: { systemNumber: 'XYZEP5JYOMM00020', createdTimestamp: '2019-06-15T10:26:54.903Z' } ,
//         stageVariables: null,
//         body: JSON.stringify({ "reasonForArchiving": "Just a test for archiving" }),
//         isBase64Encoded: false,
//       };
//       process.env.AWS_SAM_LOCAL = 'true';

//       mockGetBySystemNumberAndCreatedTimestamp.mockResolvedValueOnce(archivePatchData);
//       mockArchiveRecord.mockResolvedValueOnce({});

//       const result = await handler(event as unknown as APIGatewayProxyEvent);
//       console.info(result);
//       expect(mockGetBySystemNumberAndCreatedTimestamp).toHaveBeenCalledTimes(1);
//       expect(result.statusCode).toBe(200);
//       expect(result.body).not.toBeNull();
//     });
//   })
// });
