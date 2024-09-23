/* eslint-disable no-param-reassign */
import { TechRecordGETHGVSkeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/skeleton';
import { TechRecordGETTRLSkeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/trl/skeleton';
import { TechRecordGETTRLTestable } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/trl/testable';
import { TechRecordGETHGV, TechRecordGETTRL } from '@dvsa/cvs-type-definitions/types/v3/tech-record/tech-record-verb-vehicle-type';
import * as fs from 'fs';
import completeHGVTechRecord from '../../tests/resources/techRecordCompleteHGVPlate.json'; // This record is labeled complete, and has all information for generating a plate. But ius actually marked as testable
import completeTRLTechRecords from '../hotfix/cb2-11175/tests/resources/technical-records-v3-no-plates.json';

function padZeroes(number: string, size: number) {
  number = number.toString();
  while (number.length < size) number = `0${number}`;
  return number;
}

export const generateBatchPlateData = () => {
  let fileCount = 1;
  const fileNames = [];
  const date = new Date().toISOString();
  let records = [];
  const triggerData = [];
  console.log('starting');
  // complete TRLs
  for (let i = 10; i <= 40000; i++) {
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRL;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });

    if (i % 1000 === 0) {
      const fileName = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
      fileNames.push(fileName);
      fs.writeFileSync(fileName, JSON.stringify(records, null, 2));
      records = [];
      fileCount++;
    }
  }

  records = [];

  // Complete HGVs
  for (let i = 40001; i <= 80000; i++) {
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGV;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    record.primaryVrm = `${paddedIterator}Z`;

    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });

    if (i % 1000 === 0) {
      const fileName = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
      fileNames.push(fileName);
      fs.writeFileSync(fileName, JSON.stringify(records, null, 2));
      records = [];
      fileCount++;
    }
  }

  records = [];
  // Missing functionCode
  for (let i = 80001; i <= 80500; i++) {
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRL;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    delete record.techRecord_functionCode;
    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });
  }

  const fileName1 = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
  fileNames.push(fileName1);
  fs.writeFileSync(fileName1, JSON.stringify(records, null, 2));
  records = [];
  fileCount++;

  // missing model and functionCode
  for (let i = 80501; i <= 90000; i++) {
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRL;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    delete record.techRecord_functionCode;
    delete record.techRecord_model;
    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });

    if (i % 1000 === 0) {
      const fileName = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
      fileNames.push(fileName);
      fs.writeFileSync(fileName, JSON.stringify(records, null, 2));
      records = [];
      fileCount++;
    }
  }

  records = [];

  // missing variantNumber
  for (let i = 90001; i <= 98000; i++) {
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGV;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    record.primaryVrm = `${paddedIterator}Z`;
    delete record.techRecord_variantNumber;

    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });

    if (i % 1000 === 0) {
      const fileName = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
      fileNames.push(fileName);
      fs.writeFileSync(fileName, JSON.stringify(records, null, 2));
      records = [];
      fileCount++;
    }
  }
  records = [];
  console.log('98K');

  // missing roadFriendly
  for (let i = 98001; i <= 100000; i++) {
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGV;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    record.primaryVrm = `${paddedIterator}Z`;
    delete record.techRecord_roadFriendly;

    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });
  }
  console.log('100K');
  const fileName3 = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
  fileNames.push(fileName3);
  fs.writeFileSync(fileName3, JSON.stringify(records, null, 2));
  records = [];
  fileCount++;

  console.log('100K');
  // HGV Skeleton
  for (let i = 100001; i <= 101000; i++) {
    const record = JSON.parse(JSON.stringify(completeHGVTechRecord)) as TechRecordGETHGVSkeleton;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    record.primaryVrm = `${paddedIterator}Z`;
    record.techRecord_recordCompleteness = 'skeleton';

    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });
  }
  const fileName4 = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
  fileNames.push(fileName4);
  fs.writeFileSync(fileName4, JSON.stringify(records, null, 2));
  records = [];
  fileCount++;
  // TRL Skeleton
  for (let i = 101001; i <= 102000; i++) {
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRLSkeleton;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;
    record.techRecord_recordCompleteness = 'skeleton';

    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });
  }

  const fileName5 = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
  fileNames.push(fileName5);
  fs.writeFileSync(fileName5, JSON.stringify(records, null, 2));
  records = [];
  fileCount++;

  // TRL Testable
  for (let i = 102001; i <= 103000; i++) {
    const record = JSON.parse(JSON.stringify(completeTRLTechRecords[0])) as TechRecordGETTRLTestable;
    const paddedIterator = padZeroes(i.toString(), 6);
    record.systemNumber = `BPS${paddedIterator}`;
    record.createdTimestamp = date;
    record.vin = `BPV${paddedIterator}`;
    record.partialVin = paddedIterator;

    records.push(record);
    triggerData.push({ systemNumber: record.systemNumber, createdTimestamp: record.createdTimestamp });
  }

  const fileName6 = `/tmp/technical-records-v3-with-batch-plates-${fileCount.toString()}.json`;
  fileNames.push(fileName6);
  fs.writeFileSync(fileName6, JSON.stringify(records, null, 2));
  records = [];
  fileCount++;

  console.log('written vehicles to seed data');
  fs.writeFileSync('/tmp/trigger-data.json', JSON.stringify(triggerData, null, 2));
  console.log('written vehicles to trigger data');

  console.log(fileCount);
  return fileNames;
};
