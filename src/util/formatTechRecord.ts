const buildNestedArray = (techRecordWithoutArrays: object, arrayName: string, formattedTechRecord: any): object => {
  const array: any[] = [];
  let objectToAdd: any = {};
  let arrayCount = 0;
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (/_\d+_/.test(key) && key.includes(arrayName)) {
      const splitKey = key.split('_');

      if (parseInt(splitKey[2], 10) === arrayCount) {
        splitKey.splice(1, 2);
        const newKey = splitKey.join('_');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
        objectToAdd[newKey] = value;
      } else {
        array.push(objectToAdd);
        arrayCount = parseInt(splitKey[2], 10);
        objectToAdd = {};
        splitKey.splice(1, 2);
        const newKey = splitKey.join('_');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
        objectToAdd[newKey] = value;
      }
    } else if (/_\d+/.test(key) && key.includes(arrayName)) {
      array.push(value);
    }
  });

  if (Object.keys(objectToAdd as object).length) {
    array.push(objectToAdd);
  }

  if (array.length) {
  // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
    formattedTechRecord[arrayName] = array;
  }

  return formattedTechRecord as object;
};

export const formatTechRecord = (techRecordWithoutArrays: object) => {
  const formattedTechRecord: any = {};
  const valuesToArrayify = ['axles', 'vehicleSubclass', 'plates'];
  valuesToArrayify.forEach((value) => buildNestedArray(techRecordWithoutArrays, value, formattedTechRecord as object));

  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (!/_\d+/.test(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
      formattedTechRecord[key] = value;
    }
  });

  return formattedTechRecord as object;
};
