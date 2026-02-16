import type { Pillar } from './pillar.ts'
import type { DoseTier } from './dose-tier.ts'
import type { PatientResolutionContext } from './resolution.ts'

export type AccessBarrierType = 'pa_pending' | 'pa_denied' | 'step_therapy' | 'copay_prohibitive' | 'formulary_excluded'

export interface AccessBarrier {
  readonly type: AccessBarrierType
  readonly description?: string
}

export interface Medication {
  readonly pillar: Pillar
  readonly name: string
  readonly doseTier: DoseTier
  readonly hasADR?: boolean
  readonly adrDescription?: string
  readonly hasAllergy?: boolean
  readonly patientRefusal?: boolean
  readonly costBarrier?: boolean
  readonly accessBarrier?: AccessBarrier
}

export interface PatientHistory {
  readonly recentAKI?: boolean
  readonly adrHistory?: Readonly<Partial<Record<Pillar, string>>>
  readonly allergies?: ReadonlyArray<Pillar>
}

export interface PatientSnapshot {
  // Domain identification
  readonly domainId?: string
  // Heart Failure fields
  readonly ef: number
  readonly nyhaClass: 1 | 2 | 3 | 4
  readonly sbp: number
  readonly hr: number
  readonly vitalsDate: string
  readonly egfr?: number
  readonly potassium?: number
  readonly labsDate?: string
  readonly bnp?: number
  readonly ntProBnp?: number
  readonly dmType?: 'none' | 'type1' | 'type2'
  // Diabetes-specific fields
  readonly hba1c?: number
  readonly fastingGlucose?: number
  readonly bmi?: number
  readonly cvdRisk?: boolean
  readonly ckd?: boolean
  // Hypertension-specific fields
  readonly dbp?: number
  readonly targetSBP?: number
  readonly targetDBP?: number
  readonly htnStage?: 'stage1' | 'stage2' | 'resistant'
  // Common
  readonly medications: ReadonlyArray<Medication>
  readonly history?: PatientHistory
  readonly surgeryDate?: string
  readonly resolutionContext?: PatientResolutionContext
}
