import { schemas } from '@dvsa/cvs-type-definitions/schemas';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
export const identifyObjectType = (obj: any, method: HttpMethod) => identifySchema(obj.techRecord_vehicleType, obj.techRecord_recordCompleteness, method);
//return one value not multiple
export const identifySchema = (vehicleType: VehicleType, recordCompleteness: RecordCompleteness, method: HttpMethod) => schemas
  .find((x: string) => x.includes(vehicleType) && x.includes(recordCompleteness) && x.includes(method));
