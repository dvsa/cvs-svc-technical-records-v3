export interface MotRecalls {
  vin: string,
  manufacturer: string,
  recalls: Recall[],
  lastUpdatedDate: string
}

export interface Recall {
  manufacturerCampaignReference: string,
  dvsaCampaignReference: string,
  recallCampaignStartDate: string,
  repairStatus: RepairStatus
}

type RepairStatus = "FIXED" | "NOT_FIXED"

export interface MotSecret {
  clientID: string,
  clientSecret: string,
  scopeURL: string,
  accessTokenURL: string,
  apiKey: string,
  apiURL: string,
}