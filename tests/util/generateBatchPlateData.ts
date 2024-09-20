import * as fs from 'fs'
import completeHGVTechRecord from '../resources/techRecordCompleteHGVPlate.json'; //This record is labeled complete, and has all information for generating a plate. But ius actually marked as testable
import completeTRLTechRecords from '../../src/hotfix/cb2-11175/tests/resources/technical-records-v3-no-plates.json'
import existingSeed from '../resources/technical-records-v3.json';
import { TechRecordGETHGV, TechRecordGETTRL } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';
import { TechRecordGETHGVSkeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/skeleton';
import { TechRecordGETTRLSkeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/trl/skeleton';
import { TechRecordGETTRLTestable } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/trl/testable';

function padZeroes(number: string, size: number) {
    number = number.toString();
    while (number.length < size) number = "0" + number;
    return number;
}

let records = []
let triggerData = []
console.log("starting")
//complete TRLs
for(var i = 10; i<=400; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRL
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}
//Complete HGVs
for(var i = 401; i<=800; i++)
{
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGV
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    record.primaryVrm = `${paddedIterator}Z`

    records.push(record)
    triggerData.push({systemNumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}

//Missing functionCode
for(var i = 801; i<=805; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRL
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    delete record.techRecord_functionCode
    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}
//missing model and functionCode
for(var i = 806; i<=900; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRL
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    delete record.techRecord_functionCode
    delete record.techRecord_model
    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}
//missing variantNumber
for(var i = 901; i<=980; i++)
{
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGV
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    record.primaryVrm = `${paddedIterator}Z`
    delete record.techRecord_variantNumber

    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}
//missing roadFriendly
for(var i = 981; i<=1000; i++)
{
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGV
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    record.primaryVrm = `${paddedIterator}Z`
    delete record.techRecord_roadFriendly

    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}
//HGV Skeleton
for(var i = 1000; i<=1010; i++)
{
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGVSkeleton
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    record.primaryVrm = `${paddedIterator}Z`
    record.techRecord_recordCompleteness = 'skeleton'

    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}
//TRL Skeleton
for(var i = 1011; i<=1020; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRLSkeleton
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    record.techRecord_recordCompleteness = 'skeleton'

    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}

//TRL Testable
for(var i = 1021; i<=1030; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRLTestable
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator

    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}

const output = [...existingSeed, ...records]
fs.writeFile('tests/resources/technical-records-v3.json', JSON.stringify(output, null, 2), (err)=> 
    {if(err){
        throw err
    }
    else {
    console.log("written vehicles to seed data")
}})
fs.writeFile('tests/resources/trigger-data.json', JSON.stringify(triggerData, null, 2), (err)=> 
    {if(err){
        throw err
    }
    else {
    console.log("written vehicles to trigger data")
}})
