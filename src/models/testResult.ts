import { AttributeValue } from '@aws-sdk/client-dynamodb';

export type TestType = {
  testTypeId: string;
  testResult: string | null;
};
export interface TestResult {
  systemNumber: string;
  testTypes: TestType[];
  euVehicleCategory?: string;
  testStatus: string;
  createdById: string;
  createdByName: string;
}

export interface DynamoDB {
  NewImage: Record<string, AttributeValue>;
}
export interface TestResultSQSRecord {
  eventName: string;
  dynamodb: DynamoDB;
}
