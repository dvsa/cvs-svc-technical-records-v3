export const validateUpdateStatus = (
  testStatus: string,
  testResult: string,
  testTypeId: string,
): boolean => (
  testStatus === 'submitted'
      && (testResult === 'pass' || testResult === 'prs')
      && (isTestTypeFirstTest(testTypeId)
        || isTestTypeNotifiableAlteration(testTypeId)
        || isTestTypeCOIF(testTypeId))
);

function isTestTypeFirstTest(testTypeId: string): boolean {
  const firstTestIds = ['41', '95', '65', '66', '67', '103', '104', '82', '83', '119', '120', '186', '188', '192', '194'];
  return firstTestIds.includes(testTypeId);
}

function isTestTypeNotifiableAlteration(testTypeId: string): boolean {
  const notifiableAlterationIds = ['38', '47', '48'];
  return notifiableAlterationIds.includes(testTypeId);
}

function isTestTypeCOIF(testTypeId: string): boolean {
  const coifIds = ['142', '143', '175', '176'];
  return coifIds.includes(testTypeId);
}
