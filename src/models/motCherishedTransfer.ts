export interface MotCherishedTransfer {
  vin: string;
  vrm: string;
}

export interface ProcessedMotCherishedTransfers {
  fileName: string;
  cherishedTransfers: Array<MotCherishedTransfer>;
}
