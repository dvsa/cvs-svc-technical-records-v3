import { TechRecordGETHGV, TechRecordGETTRL } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';

export type PlateRequestBody = {
  vtmUsername: string;
  recipientEmailAddress: string;
  reasonForCreation: PlateReasonForIssue;
};

export enum PlateReasonForIssue {
  FREE_REPLACEMENT = 'Free replacement',
  REPLACEMENT = 'Replacement',
  DESTROYED = 'Destroyed',
  PROVISIONAL = 'Provisional',
  ORIGINAL = 'Original',
  MANUAL = 'Manual',
}

export interface Plates {
  plateSerialNumber?: string;
  plateIssueDate?: string;
  plateReasonForIssue?: PlateReasonForIssue;
  plateIssuer?: string;
}

export type TechRecordGETHGVOrTRL = TechRecordGETHGV | TechRecordGETTRL;
