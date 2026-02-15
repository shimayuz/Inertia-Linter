import type { Pillar } from './pillar.ts'

export type ActionDecision = 'undecided' | 'address_now' | 'defer' | 'not_applicable'

export type ActionPriority = 'high' | 'medium' | 'low'

export type ActionCategory = 'initiate' | 'uptitrate' | 'resolve_blocker' | 'order_labs' | 'reassess'

export interface ActionItem {
  readonly id: string
  readonly pillar: Pillar
  readonly category: ActionCategory
  readonly priority: ActionPriority
  readonly title: string
  readonly rationale: string
  readonly suggestedAction: string
  readonly evidence: string
  readonly cautions: ReadonlyArray<string>
}

export interface ActionDecisionRecord {
  readonly actionId: string
  readonly decision: ActionDecision
  readonly reason?: string
  readonly timestamp: string
}
