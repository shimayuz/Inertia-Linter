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
  readonly medications: ReadonlyArray<Medication>
  readonly history?: PatientHistory
  readonly surgeryDate?: string
  readonly resolutionContext?: PatientResolutionContext
}
