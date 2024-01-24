import { TechRecordType } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb';

export type UpdateVrmRequestBody = {
  newVrm: string
  isCherishedTransfer: boolean,
  thirdMark?: string
};

export type SNSMessageBody = TechRecordType<'get'> & { userEmail?: string };
