/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { POSTPSVTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/post/psv/complete';
import { identifySchema } from '../validators/post';
import logger from './logger';

export function computeRecordCompleteness(input: any) {
  const generalVehicleErrors = generalErrors(input);
  if (generalVehicleErrors) {
    logger.info('general errors: ', generalVehicleErrors);
    return 'skeleton';
  }

  const isComplete = identifySchema(input, 'complete', 'put');
  const isTestable = identifySchema(input, 'testable', 'put');
  const isSkeleton = identifySchema(input, 'skeleton', 'put');

  if (isComplete) { return 'complete'; }
  if (isTestable) { return 'testable'; }
  if (isSkeleton) { return 'skeleton'; }
  return '';
}

const generalErrors = <T extends POSTPSVTechnicalRecordV3Complete> (input: T) => {
  if (!input.techRecord_vehicleType) {
    return 'Missing vehicle type';
  }
  if (!input.systemNumber) {
    throw new Error('System Number generation failed');
  }
  if (input.techRecord_hiddenInVta) {
    return 'skeleton';
  }
  return '';
};
