import { GETHGVTechnicalRecordV3Complete } from "@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete";
import { GETHGVTechnicalRecordV3Skeleton } from "@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/skeleton";
import { GETHGVTechnicalRecordV3Testable } from "@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/testable";

export type ArchiveRecord = GETHGVTechnicalRecordV3Complete |
  GETHGVTechnicalRecordV3Testable
  | GETHGVTechnicalRecordV3Skeleton
