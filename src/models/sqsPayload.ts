import { Letter } from './letter';
import { Plates } from './plate';

export interface SQSRequestBody {
  techRecord: object;
  plate?: Plates;
  letter?: Letter;
  documentName: DocumentName;
  recipientEmailAddress: string;
}

export const enum DocumentName {
  MINISTRY = 'VTG6_VTG7',
  TRL_INTO_SERVICE = 'TrailerIntoService',
}
