import { ProcessedMotCherishedTransfers } from "../models/motCherishedTransfer";

export function processMotCherishedTransfer(csvData: string): ProcessedMotCherishedTransfers {
  const lines = csvData.trim().split('\n');
  const header = lines[0];

  const cherishedTransfers = lines.slice(1).map(line => {
    const columnValues = line.split(',');

    return {
      vrm: columnValues[0],
      vin: columnValues[2]
    }
  });

  return {
    fileName: header,
    cherishedTransfers: cherishedTransfers
  };
}
