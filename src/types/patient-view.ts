import type { Pillar, PillarStatus } from './pillar.ts'

export const NUDGE_TYPES = {
  MEDICATION_REMINDER: 'medication_reminder',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  LAB_DUE: 'lab_due',
  LIFESTYLE_TIP: 'lifestyle_tip',
  MILESTONE_CELEBRATION: 'milestone_celebration',
} as const

export type NudgeType = typeof NUDGE_TYPES[keyof typeof NUDGE_TYPES]

export const NUDGE_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

export type NudgePriority = typeof NUDGE_PRIORITIES[keyof typeof NUDGE_PRIORITIES]

export const NUDGE_STATUSES = {
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  DISMISSED: 'dismissed',
  COMPLETED: 'completed',
} as const

export type NudgeStatus = typeof NUDGE_STATUSES[keyof typeof NUDGE_STATUSES]

export interface Nudge {
  readonly id: string
  readonly type: NudgeType
  readonly priority: NudgePriority
  readonly title: string
  readonly message: string
  readonly actionLabel?: string
  readonly pillar?: Pillar
  readonly dueDate?: string
  readonly status: NudgeStatus
}

export interface PatientInsight {
  readonly overallScore: number
  readonly maxScore: number
  readonly scoreLabel: string
  readonly domainLabel: string
  readonly pillarsOnTrack: number
  readonly totalPillars: number
  readonly topAction: string
  readonly encouragement: string
}

export interface DecisionOption {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly pros: ReadonlyArray<string>
  readonly cons: ReadonlyArray<string>
  readonly costEstimate?: string
  readonly evidenceLevel?: string
}

export interface SharedDecisionContext {
  readonly pillar: Pillar
  readonly currentStatus: PillarStatus
  readonly question: string
  readonly options: ReadonlyArray<DecisionOption>
  readonly riskWithout: string
  readonly benefitWith: string
}

export const METRIC_STATUSES = {
  AT_TARGET: 'at_target',
  NEAR_TARGET: 'near_target',
  OFF_TARGET: 'off_target',
  UNKNOWN: 'unknown',
} as const

export type MetricStatus = typeof METRIC_STATUSES[keyof typeof METRIC_STATUSES]

export interface MetricTarget {
  readonly label: string
  readonly min?: number
  readonly max?: number
  readonly nearMin?: number
  readonly nearMax?: number
}

export interface ClinicalMetric {
  readonly id: string
  readonly label: string
  readonly value: number | undefined
  readonly unit: string
  readonly target?: MetricTarget
  readonly status: MetricStatus
  readonly isPrimary: boolean
  readonly secondaryValue?: number
  readonly secondaryUnit?: string
}
