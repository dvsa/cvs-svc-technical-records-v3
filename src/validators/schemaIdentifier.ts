import { schemas } from '@dvsa/cvs-type-definitions/schemas';
import { HttpMethod, RecordCompleteness, VehicleTypeWithSmallTrl } from '../util/enum';

export const identifySchema = (vehicleType: VehicleTypeWithSmallTrl, recordCompleteness: RecordCompleteness, method: HttpMethod) => schemas
  .find((x: string) => x.includes(`/${vehicleType}/`) && x.includes(recordCompleteness) && x.includes(method));
