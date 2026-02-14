import type { Pillar } from './pillar.ts'
import type { DoseTier } from './dose-tier.ts'

export interface Medication {
  readonly pillar: Pillar
  readonly name: string
  readonly doseTier: DoseTier
  readonly hasADR?: boolean
  readonly adrDescription?: string
  readonly hasAllergy?: boolean
  readonly patientRefusal?: boolean
  readonly costBarrier?: boolean
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
  readonly dmType?: 'none' | 'type1' | 'type2'
  readonly medications: ReadonlyArray<Medication>
  readonly history?: PatientHistory
}
