export const createPartialVin = (vin: string): string => {
  if (vin.length < 6) {
    return vin.toUpperCase();
  }
  return vin.substring(Math.max(vin.length - 6)).toUpperCase();
};
