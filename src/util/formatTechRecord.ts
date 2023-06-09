const buildArray = (techRecordWithoutArrays: object, arrayName: string, formattedTechRecord: any): object => {
  const arrayToAdd: any[] = [];
  let objectToAdd: any = {};
  let arrayIndex = 0;
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (/_\d+_/.test(key) && key.includes(arrayName)) {
      const splitKey = key.split('_');

      if (parseInt(splitKey[2], 10) === arrayIndex) {
        splitKey.splice(1, 2);
        const newKey = splitKey.join('_');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
        objectToAdd[newKey] = value;
      } else {
        arrayToAdd.push(objectToAdd);
        arrayIndex = parseInt(splitKey[2], 10);
        objectToAdd = {};
        splitKey.splice(1, 2);
        const newKey = splitKey.join('_');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
        objectToAdd[newKey] = value;
      }
    } else if (/_\d+/.test(key) && key.includes(arrayName)) {
      arrayToAdd.push(value);
    }
  });

  if (Object.keys(objectToAdd as object).length) {
    arrayToAdd.push(objectToAdd);
  }

  if (arrayToAdd.length) {
  // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
    formattedTechRecord[arrayName] = arrayToAdd;
  }

  return formattedTechRecord as object;
};

export const formatTechRecord = (techRecordWithoutArrays: object) => {
  const formattedTechRecord: any = {};
  const arrayNames: string[] = [];
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (!/_\d+/.test(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
      formattedTechRecord[key] = value;
    } else {
      arrayNames.push(key.split('_')[1]);
    }
  });
  const valuesToArrayify = [...new Set(arrayNames)];
  valuesToArrayify.forEach((value) => buildArray(techRecordWithoutArrays, value, formattedTechRecord as object));

  return formattedTechRecord as object;
};
