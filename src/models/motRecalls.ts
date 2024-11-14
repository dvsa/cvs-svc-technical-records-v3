export interface motRecalls {
  vin: string,
  manufacturer: string,
  recalls: recall[],
  lastUpdatedDate: string
}

interface recall {
  manufacturerCampaignReference: string,
  dvsaCampaignReference: string,
  recallCampaignStartDate: string,
  repairStatus: repairStatus
}

type repairStatus = "FIXED" | "NOT_FIXED"
