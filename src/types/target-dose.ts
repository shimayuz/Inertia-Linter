import type { Pillar } from './pillar.ts'
import type { DoseTier } from './dose-tier.ts'

export interface DoseStep {
  readonly label: string
  readonly tier: DoseTier
  readonly note?: string
}

export interface DrugTargetDose {
  readonly drugName: string
  readonly genericName: string
  readonly brandName?: string
  readonly pillar: Pillar
  readonly targetDose: string
  readonly steps: ReadonlyArray<DoseStep>
  readonly monitoringPerStep: ReadonlyArray<string>
  readonly titrationInterval: string
  readonly guidelineSource: string
  readonly doi: string
}
