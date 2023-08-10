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
