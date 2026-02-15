import type { FHIRBundle, FHIRCondition } from '../fhir/types.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { AuditResult } from '../types/audit.ts'

export interface ClinicalDomain {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly pillars: ReadonlyArray<string>
  readonly status: 'active' | 'stub'
  readonly applicableTo: (conditions: ReadonlyArray<FHIRCondition>) => boolean
  readonly transformBundle: (bundle: FHIRBundle) => PatientSnapshot
  readonly runAudit: (snapshot: PatientSnapshot) => AuditResult
}
