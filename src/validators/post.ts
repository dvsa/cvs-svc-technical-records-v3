/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment

import { schemas } from '@dvsa/cvs-type-definitions/lib/schemas';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';

export const identifyObjectType = (obj: any, method: HttpMethod) => identifySchema(obj.techRecord_vehicleType, obj.techRecord_recordCompleteness, method);
export const identifySchema = (vehicleType: VehicleType, recordCompleteness: RecordCompleteness, method: HttpMethod) => schemas
  .filter((x: string | string[]) => (x.includes(vehicleType) && x.includes(recordCompleteness)))
  .filter(((x: string | string[]) => x.includes(method)))
  .map((x) => x);
