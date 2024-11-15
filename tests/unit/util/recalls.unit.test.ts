import { MotRecalls } from "../../../src/models/motRecalls";
import { filterMotRecalls } from "../../../src/util/recalls";

describe('Recalls util functions', () => {

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date());
    })

    describe('filterMotRecalls', () => {
        let date: Date;
        const emptyResponse = {
            manufacturer: null,
            hasRecall: false,
        }

        beforeEach(() => {
            date = new Date()
        })

        it('should correctly filter a list of 3 when one is a recall', () => {
            const recallResponse = {
                vin: '1234',
                manufacturer: 'test manufacturer',
                recalls: [
                    {
                        manufacturerCampaignReference: '123ABC',
                        dvsaCampaignReference: '1234ABC',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "NOT_FIXED"
                    },
                    {
                        manufacturerCampaignReference: '123CBA',
                        dvsaCampaignReference: '1234CBA',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "FIXED"
                    },
                    {
                        manufacturerCampaignReference: 'CBA123',
                        dvsaCampaignReference: 'CBA1234',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "FIXED"
                    }
                ],
                lastUpdatedDate: '123456'
            }
            const res = filterMotRecalls(recallResponse as MotRecalls)
            expect(res).toStrictEqual({
                manufacturer: 'test manufacturer',
                hasRecall: true,
            })
        })
        it('should correctly filter a list of 3 when two are recalls', () => {
            const recallResponse = {
                vin: '1234',
                manufacturer: 'test manufacturer',
                recalls: [
                    {
                        manufacturerCampaignReference: '123ABC',
                        dvsaCampaignReference: '1234ABC',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "NOT_FIXED"
                    },
                    {
                        manufacturerCampaignReference: '123CBA',
                        dvsaCampaignReference: '1234CBA',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "NOT_FIXED"
                    },
                    {
                        manufacturerCampaignReference: 'CBA123',
                        dvsaCampaignReference: 'CBA1234',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "FIXED"
                    }
                ],
                lastUpdatedDate: '123456'
            }
            const res = filterMotRecalls(recallResponse as MotRecalls)
            expect(res).toStrictEqual({
                manufacturer: 'test manufacturer',
                hasRecall: true,
            })
        })
        it('should filter to nothing when all dates are in the future', () => {
            const recallResponse = {
                vin: '1234',
                manufacturer: 'test manufacturer',
                recalls: [
                    {
                        manufacturerCampaignReference: '123ABC',
                        dvsaCampaignReference: '1234ABC',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() + 1))).toISOString().split("T")[0],
                        repairStatus: "NOT_FIXED"
                    },
                    {
                        manufacturerCampaignReference: '123CBA',
                        dvsaCampaignReference: '1234CBA',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() + 2))).toISOString().split("T")[0],
                        repairStatus: "NOT_FIXED"
                    }
                ],
                lastUpdatedDate: '123456'
            }
            const res = filterMotRecalls(recallResponse as MotRecalls)
            expect(res).toStrictEqual(emptyResponse)
        })
        it('should filter to nothing when all vehicles are fixed', () => {
            const recallResponse = {
                vin: '1234',
                manufacturer: 'test manufacturer',
                recalls: [
                    {
                        manufacturerCampaignReference: '123ABC',
                        dvsaCampaignReference: '1234ABC',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "FIXED"
                    },
                    {
                        manufacturerCampaignReference: '123CBA',
                        dvsaCampaignReference: '1234CBA',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() - 1))).toISOString().split("T")[0],
                        repairStatus: "FIXED"
                    }
                ],
                lastUpdatedDate: '123456'
            }
            const res = filterMotRecalls(recallResponse as MotRecalls)
            expect(res).toStrictEqual(emptyResponse)
        })
        it('should filter to nothing when all vehicles are fixed and all dates are in the future', () => {
            const recallResponse = {
                vin: '1234',
                manufacturer: 'test manufacturer',
                recalls: [
                    {
                        manufacturerCampaignReference: '123ABC',
                        dvsaCampaignReference: '1234ABC',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() + 1))).toISOString().split("T")[0],
                        repairStatus: "FIXED"
                    },
                    {
                        manufacturerCampaignReference: '123CBA',
                        dvsaCampaignReference: '1234CBA',
                        recallCampaignStartDate: new Date((date.setDate(date.getDate() + 1))).toISOString().split("T")[0],
                        repairStatus: "FIXED"
                    }
                ],
                lastUpdatedDate: '123456'
            }
            const res = filterMotRecalls(recallResponse as MotRecalls)
            expect(res).toStrictEqual(emptyResponse)
        })
    })


})