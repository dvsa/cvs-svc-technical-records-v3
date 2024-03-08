import { HGVAxles } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PlateRequestBody, Plates, TechRecordGETHGVOrTRL } from '../models/plate';
import {
  HgvOrTrl,
  hgvRequiredFields,
  trlRequiredFields,
  tyreRequiredFields,
} from '../models/plateRequiredFields';
import { StatusCode } from '../util/enum';
import { addHttpHeaders } from '../util/httpHeaders';
import { validateSysNumTimestampPathParams } from './sysNumTimestamp';

export const validatePlateRequestBody = (event: APIGatewayProxyEvent): APIGatewayProxyResult | undefined => {
  const isPathInvalid: APIGatewayProxyResult | undefined = validateSysNumTimestampPathParams(event);

  if (isPathInvalid) {
    return isPathInvalid;
  }

  if (!event.body || !Object.keys(event.body).length) {
    return {
      statusCode: 400,
      body: 'invalid request',
    };
  }

  const body = JSON.parse(event.body) as PlateRequestBody;

  if (!body.reasonForCreation) {
    return {
      statusCode: 400,
      body: 'Reason for creation not provided',
    };
  }

  if (!body.vtmUsername) {
    return {
      statusCode: 400,
      body: 'No username provided',
    };
  }

  if (!body.recipientEmailAddress) {
    return {
      statusCode: 400,
      body: 'No recipient email provided',
    };
  }

  return undefined;
};

export const validatePlateInfo = (plate: Plates): APIGatewayProxyResult | undefined => {
  if (!plate) {
    return {
      statusCode: 500,
      body: 'Missing plate information',
    };
  }

  if (!plate.plateSerialNumber) {
    return {
      statusCode: 500,
      body: 'Missing plate serial number',
    };
  }

  if (!plate.plateIssueDate) {
    return {
      statusCode: 500,
      body: 'Missing plate issue date',
    };
  }

  if (!plate.plateReasonForIssue) {
    return {
      statusCode: 500,
      body: 'Missing plate reason for issue',
    };
  }

  if (!plate.plateIssuer) {
    return {
      statusCode: 500,
      body: 'Missing plate issuer',
    };
  }

  return undefined;
};

export const validatePlateRecordErrors = (record: TechRecordGETHGVOrTRL, systemNumber: string, createdTimestamp: string) => {
  if (!record || !Object.keys(record).length) {
    return addHttpHeaders({
      statusCode: 404,
      body: `No record found matching systemNumber ${systemNumber} and timestamp ${createdTimestamp}`,
    });
  }

  if (record.techRecord_statusCode !== StatusCode.CURRENT) {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Tech record provided is not current',
    });
  }

  if (record.techRecord_vehicleType !== 'trl' && record.techRecord_vehicleType !== 'hgv') {
    return addHttpHeaders({
      statusCode: 400,
      body: 'Tech record is not a HGV or TRL',
    });
  }

  return undefined;
};

export function validateTechRecordPlates(record: HgvOrTrl): APIGatewayProxyResult | undefined {
  const plateValidationTable = record.techRecord_vehicleType === 'trl' ? trlRequiredFields : hgvRequiredFields;

  if (cannotGeneratePlate(plateValidationTable, record)) {
    return {
      statusCode: 400,
      body: 'Tech record is missing mandatory fields for a plate',
    };
  }
  return undefined;
}

export function cannotGeneratePlate(plateRequiredFields: string[], record: HgvOrTrl): boolean {
  const isOneFieldEmpty = plateRequiredFields.some((field) => {
    const value = record[field as keyof HgvOrTrl];
    return value === undefined || value === null || value === '';
  });
  const { techRecord_noOfAxles: noOfAxles, techRecord_axles: axles } = record;
  const areAxlesInvalid = !noOfAxles || noOfAxles < 1 || !axles || axles[0].weights_gbWeight == null;
  const areTyresInvalid = record.techRecord_axles?.some((axle) => {
    tyreRequiredFields.some(
      (field) => {
        const value = (axle as HGVAxles)[field as keyof HGVAxles];
        return value === undefined || value === null || value === '';
      },
    );
    // either one of ply rating or load index is required
    const plyOrLoad = axle['tyres_plyRating' as keyof HGVAxles] || axle['tyres_dataTrAxles' as keyof HGVAxles];
    return plyOrLoad === undefined || plyOrLoad === null || plyOrLoad === '';
  });

  return isOneFieldEmpty || areAxlesInvalid || !!areTyresInvalid;
}
