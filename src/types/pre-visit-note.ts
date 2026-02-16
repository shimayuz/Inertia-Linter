import type { Pillar } from './pillar.ts'
import type { DoseTier } from './dose-tier.ts'

export type MedicationChangeType = 'INITIATE' | 'UPTITRATE' | 'CONTINUE' | 'DISCONTINUE'

export interface MedicationPlan {
  readonly pillar: Pillar
  readonly drugName: string
  readonly changeType: MedicationChangeType
  readonly currentDose: DoseTier
  readonly targetDose: DoseTier
  readonly rationale: string
  readonly monitoringItems: ReadonlyArray<string>
}

export interface PatientExplanation {
  readonly pillar: Pillar
  readonly drugName: string
  readonly explanation: string
  readonly sideEffectsToWatch: ReadonlyArray<string>
  readonly whenToCallDoctor: string
}

export interface ResolutionTask {
  readonly pillar: Pillar
  readonly type: string
  readonly description: string
  readonly status: string
}

export interface PreVisitNote {
  readonly generatedAt: string
  readonly gdmtScore: number
  readonly efCategory: string
  readonly medicationPlans: ReadonlyArray<MedicationPlan>
  readonly patientExplanations: ReadonlyArray<PatientExplanation>
  readonly deferredItems: ReadonlyArray<{
    readonly pillar: Pillar
    readonly reason: string
  }>
  readonly nextVisitMonitoring: ReadonlyArray<string>
  readonly resolutionTasks?: ReadonlyArray<ResolutionTask>
}
