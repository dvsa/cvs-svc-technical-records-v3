const buildNestedArray = (techRecordWithoutArrays: object, arrayName: string) => {
  const array: any[] = [];
  let objectToAdd: any = {};
  let arrayCount = 0;
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (/_\d_/.test(key) && key.includes(arrayName)) {
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
    }
  });

  if (Object.keys(objectToAdd as object).length) {
    array.push(objectToAdd);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return array;
};

const buildVehicleSubclass = (techRecordWithoutArrays: object) => {
  const vehicleSubclass: any[] = [];
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (/vehicleSubclass_\d/.test(key)) {
      vehicleSubclass.push(value);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return vehicleSubclass;
};

export const formatTechRecord = (techRecordWithoutArrays: object) => {
  const axles = buildNestedArray(techRecordWithoutArrays, 'axles');
  const vehicleSubclass = buildVehicleSubclass(techRecordWithoutArrays);
  const plates = buildNestedArray(techRecordWithoutArrays, 'plates');

  const formattedTechRecord: any = {};
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (!/_\d/.test(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
      formattedTechRecord[key] = value;
    }
  });

  if (axles.length) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    formattedTechRecord.axles = axles;
  }

  if (vehicleSubclass.length) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    formattedTechRecord.vehicleSubclass = vehicleSubclass;
  }

  if (plates.length) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    formattedTechRecord.plates = plates;
  }

  return formattedTechRecord as object;
};
