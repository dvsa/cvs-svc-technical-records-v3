// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildArray = (techRecordWithoutArrays: object, arrayName: string, formattedTechRecord: any): object => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arrayToAdd: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let objectToAdd: any = {};
  let arrayIndex = 0;
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (/_\d+_/.test(key) && key.includes(arrayName)) {
      const splitKey = key.split('_');

      if (parseInt(splitKey[2], 10) === arrayIndex) {
        splitKey.splice(0, 3);
        const newKey = splitKey.join('_');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
        objectToAdd[newKey] = value;
      } else {
        arrayToAdd.push(objectToAdd);
        arrayIndex = parseInt(splitKey[2], 10);
        objectToAdd = {};
        splitKey.splice(0, 3);
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

export const formatTechRecord = <T>(techRecordWithoutArrays: object): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedTechRecord: any = {};
  const arrayNames: string[] = [];
  Object.entries(techRecordWithoutArrays).sort().forEach(([key, value]) => {
    if (!/_\d+/.test(key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection, @typescript-eslint/no-unsafe-member-access
      formattedTechRecord[key] = value;
    } else {
      arrayNames.push(`${key.split('_')[0]}_${key.split('_')[1]}`);
    }
  });
  const valuesToArrayify = [...new Set(arrayNames)];
  valuesToArrayify.forEach((value) => buildArray(techRecordWithoutArrays, value, formattedTechRecord as object));

  return formattedTechRecord as T;
};

/**
 * Conditional type that is used while flattening.
 */
type FlattenArrays<T> = T extends (infer U)[] ? FlattenArrays<U>[] :
  T extends object ? { [K in keyof T as K extends 'secondaryVrms' ? never : K]: FlattenArrays<T[K]> } : T;

/**
 * This function takes an input of type T and returns a flattened object.
 * The purpose of this method is to recursively flatten using the helper function flattenArray
 * @param input: T
 * @returns flattened object
 *
 */
export const flattenArrays = <T>(input: T): FlattenArrays<T> => {
  const flattenArray = <U>(obj: U, path: string): FlattenArrays<U> => {
    if (Array.isArray(obj)) {
      return obj.reduce<FlattenArrays<U>>((acc, curr, index) => {
        const key: string = path && !path.includes('secondaryVrms') ? `${path}_${index}` : `${index}`;
        return {
          ...acc,
          ...flattenArray(curr, key),
        } as FlattenArrays<U>;
      }, [] as unknown as FlattenArrays<U>);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        const newPath: string = path && !path.includes('secondaryVrms') ? `${path}_${key}` : key;
        return {
          ...acc,
          ...(key === 'secondaryVrms' ? { [newPath]: value as FlattenArrays<U> } : flattenArray(value, newPath)),
        } as FlattenArrays<U>;
      }, {} as FlattenArrays<U>);
    }
    return { [path]: obj } as unknown as FlattenArrays<U>;
  };
  return flattenArray(input, '');
};
