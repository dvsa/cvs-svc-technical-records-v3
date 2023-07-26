import { TechRecordCompleteCarSchema } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/car/complete';
import { TechRecordSkeletonCarSchema } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/car/skeleton';
import { GETHGVTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/complete';
import { GETHGVTechnicalRecordV3Skeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/skeleton';
import { GETHGVTechnicalRecordV3Testable } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/hgv/testable';
import {
    TechRecordCompleteMotorcycleSchema,
} from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/motorcycle/complete';
import { GETPSVTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/psv/complete';
import { GETPSVTechnicalRecordV3Skeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/psv/skeleton';
import { GETPSVTechnicalRecordV3Testable } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/psv/testable';
import { GETTRLTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/trl/complete';
import { GETTRLTechnicalRecordV3Skeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/trl/skeleton';
import { GETTRLTechnicalRecordV3Testable } from '@dvsa/cvs-type-definitions/types/v3/tech-record/get/trl/testable';
import {
    TechRecordPUTRequestCompleteCarSchema,
} from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/car/complete';
import {
    TechRecordPUTRequestSkeletonCarSchema,
} from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/car/skeleton';
import { PUTHGVTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/hgv/complete';
import { PUTHGVTechnicalRecordV3Skeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/hgv/skeleton';
import { PUTHGVTechnicalRecordV3Testable } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/hgv/testable';
import { POSTPSVTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/psv/complete';
import { POSTPSVTechnicalRecordV3Skeleton } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/psv/skeleton';
import { POSTPSVTechnicalRecordV3Testable } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/psv/testable';
import { PUTTRLTechnicalRecordV3Complete } from '@dvsa/cvs-type-definitions/types/v3/tech-record/put/trl/complete';

export type TechrecordPut = TechRecordPUTRequestCompleteCarSchema | TechRecordPUTRequestSkeletonCarSchema
| PUTHGVTechnicalRecordV3Complete | PUTHGVTechnicalRecordV3Testable | PUTHGVTechnicalRecordV3Skeleton
| POSTPSVTechnicalRecordV3Complete | POSTPSVTechnicalRecordV3Testable | POSTPSVTechnicalRecordV3Skeleton
| PUTTRLTechnicalRecordV3Complete | GETTRLTechnicalRecordV3Testable | GETTRLTechnicalRecordV3Skeleton;

export type TechrecordGet = TechRecordCompleteCarSchema | TechRecordSkeletonCarSchema
| GETHGVTechnicalRecordV3Complete | GETHGVTechnicalRecordV3Testable | GETHGVTechnicalRecordV3Skeleton
| TechRecordCompleteMotorcycleSchema
| GETPSVTechnicalRecordV3Complete | GETPSVTechnicalRecordV3Testable | GETPSVTechnicalRecordV3Skeleton
| GETTRLTechnicalRecordV3Complete | GETTRLTechnicalRecordV3Testable | GETTRLTechnicalRecordV3Skeleton;

export type TechrecordCar = TechRecordCompleteCarSchema | TechRecordSkeletonCarSchema;
export type TechrecordHgv = PUTHGVTechnicalRecordV3Complete | PUTHGVTechnicalRecordV3Testable | PUTHGVTechnicalRecordV3Skeleton;
export type TechrecordPsv = POSTPSVTechnicalRecordV3Complete | POSTPSVTechnicalRecordV3Testable | POSTPSVTechnicalRecordV3Skeleton;
export type TechrecordMotorcycle = TechRecordCompleteMotorcycleSchema;
export type TechrecordTrl = PUTTRLTechnicalRecordV3Complete | GETTRLTechnicalRecordV3Testable | GETTRLTechnicalRecordV3Skeleton;
