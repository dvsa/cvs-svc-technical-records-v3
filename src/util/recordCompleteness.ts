// import { POSTPSVTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/post/psv/complete';
//
// export async function computeLgvRecordCompleteness<T extends POSTPSVTechnicalRecordV3Complete>(input: T): Promise<string> {
//   const generalVehicleErrors = await generalErrors(input);
//   if (generalVehicleErrors) {
//     logger.info('general errors: ', generalVehicleErrors);
//     return 'skeleton';
//   }
//
// }
//
// const generalErrors = <T extends POSTPSVTechnicalRecordV3Complete> (input: T) => {
//   if (!input.techRecord_vehicleType) {
//     return 'Missing vehicle type';
//   }
//   if (!input.systemNumber) {
//     throw new Error('System Number generation failed');
//   }
//   if (input.techRecord_hiddenInVta) {
//     return 'skeleton';
//   }
//   return '';
// };
