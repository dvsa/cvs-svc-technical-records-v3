import { MotCherishedTransfer } from "../models/motCherishedTransfer";

export function convertCsvToMotCherishedTransfer(csvData: string): MotCherishedTransfer[] {
  const lines = csvData.trim().split('\n');

  return lines.slice(1).map(line => {
    const columnValues = line.split(',');

    return {
      vrm: columnValues[0],
      vin: columnValues[2]
    }
  });
}
