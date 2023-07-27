import { schemas } from '@dvsa/cvs-type-definitions/schemas';
import { TechRecordGet } from '../models/post';
import { HttpMethod, RecordCompleteness, VehicleType } from '../util/enum';

export const identifyObjectType = (obj: TechRecordGet, method: HttpMethod) => identifySchema(obj.techRecord_vehicleType as VehicleType, obj.techRecord_recordCompleteness as RecordCompleteness, method);
export const identifySchema = (vehicleType: VehicleType, recordCompleteness: RecordCompleteness, method: HttpMethod) => schemas
  .find((x: string) => x.includes(vehicleType) && x.includes(recordCompleteness) && x.includes(method));
