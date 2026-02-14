export { EF_CATEGORIES, EF_THRESHOLDS } from './ef-category.ts'
export type { EFCategory } from './ef-category.ts'

export { PILLARS, PILLAR_LABELS, PILLAR_STATUSES, PILLAR_STATUS_COLORS } from './pillar.ts'
export type { Pillar, PillarStatus } from './pillar.ts'

export {
  BLOCKER_CODES,
  BLOCKER_UI_LABELS,
  BLOCKER_CATEGORIES,
  BLOCKER_CODE_CATEGORY,
} from './blocker.ts'
export type { BlockerCode, BlockerCategory, BlockerInfo } from './blocker.ts'

export { DOSE_TIERS, DOSE_TIER_POINTS, DOSE_TIER_LABELS } from './dose-tier.ts'
export type { DoseTier } from './dose-tier.ts'

export type { Medication, PatientHistory, PatientSnapshot } from './patient.ts'

export type { PillarResult, GDMTScore, AuditResult } from './audit.ts'

export type { GuidelinePosition, GuidelineComparison } from './guideline.ts'

export type { BarrierInfo } from './inertia-buster.ts'
