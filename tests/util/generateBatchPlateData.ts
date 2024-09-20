import * as fs from 'fs'
import completeHGVTechRecord from '../resources/techRecordCompleteHGVPlate.json';
import completeTRLTechRecord from '../resources/techRecordsTrlPost.json';
import existingSeed from '../resources/technical-records-v3.json';
import { TechRecordGETHGV, TechRecordGETTRL } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';

function padZeroes(number: string, size: number) {
    number = number.toString();
    while (number.length < size) number = "0" + number;
    return number;
}

let records = []
let triggerData = []
console.log("starting")
//complete HGVs
for(var i = 1; i<=40; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecord)) as TechRecordGETTRL
    const paddedIterator = padZeroes(i.toString(), 6)
    record.systemNumber = `BPS${paddedIterator}`
    record.createdTimestamp = "2024-09-01T12:00:00.000Z";
    record.vin = `BPV${paddedIterator}`
    record.partialVin = paddedIterator
    records.push(record)
    triggerData.push({systemnumber: record.systemNumber, createdtimestamp: record.createdTimestamp})
}
//Complete TRLs
for(var i = 41; i<=80; i++)
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
for(var i = 81; i<=85; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecord)) as TechRecordGETTRL
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
for(var i = 86; i<=90; i++)
{
    const record = JSON.parse(JSON.stringify(completeTRLTechRecord)) as TechRecordGETTRL
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
for(var i = 91; i<=98; i++)
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
for(var i = 99; i<=100; i++)
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
