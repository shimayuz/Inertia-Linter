import type { EFCategory } from './ef-category.ts'
import type { Pillar, PillarStatus } from './pillar.ts'
import type { BlockerCode } from './blocker.ts'
import type { DoseTier } from './dose-tier.ts'

export interface PillarResult {
  readonly pillar: Pillar
  readonly status: PillarStatus
  readonly doseTier: DoseTier
  readonly blockers: ReadonlyArray<BlockerCode>
  readonly missingInfo: ReadonlyArray<string>
}

export interface GDMTScore {
  readonly score: number
  readonly maxPossible: number
  readonly normalized: number
  readonly excludedPillars: ReadonlyArray<Pillar>
  readonly isIncomplete: boolean
}

export interface AuditResult {
  readonly efCategory: EFCategory
  readonly pillarResults: ReadonlyArray<PillarResult>
  readonly gdmtScore: GDMTScore
  readonly missingInfo: ReadonlyArray<string>
  readonly nextBestQuestions: ReadonlyArray<string>
  readonly timestamp: string
}
