import type { Pillar } from '../types/index.ts'
import type { EFCategory } from '../types/index.ts'
import rulesetData from './ruleset_hf_gdmt_v2.json'

export interface RuleConditions {
  readonly ef_max?: number
  readonly ef_min?: number
  readonly nyha_min?: number
  readonly requires_current_acei_arb?: boolean
  readonly requires_dm_type2?: boolean
  readonly note?: string
}

export interface RuleThresholds {
  readonly bp_low_sbp?: number
  readonly hr_low?: number
  readonly k_high?: number
  readonly egfr_init?: number
  readonly egfr_cont?: number
}

export interface RulesetEntry {
  readonly rule_id: string
  readonly guideline_id: string
  readonly pillar: Pillar
  readonly ef_categories: ReadonlyArray<EFCategory>
  readonly description: string
  readonly class: 'I' | 'IIa' | 'IIb' | 'III'
  readonly loe: 'A' | 'B-R' | 'B-NR' | 'C-LD' | 'C-EO'
  readonly conditions: RuleConditions
  readonly thresholds: RuleThresholds
  readonly source_doi: string
}

export interface PillarThresholds {
  readonly bp_low_sbp?: number
  readonly hr_low?: number
  readonly k_high?: number
  readonly egfr_init?: number
  readonly egfr_cont?: number
}

export interface MultiGuidelineDifference {
  readonly topic: string
  readonly aha: {
    readonly class: string | null
    readonly loe: string | null
    readonly rule_id: string | null
    readonly note?: string
  }
  readonly esc: {
    readonly class: string | null
    readonly loe: string | null
    readonly rule_id: string | null
    readonly note?: string
  }
  readonly display: string
}

export interface StaleDataThresholds {
  readonly labs_max_days: number
  readonly vitals_max_days: number
}

const rules: ReadonlyArray<RulesetEntry> = rulesetData.rules as ReadonlyArray<RulesetEntry>

const pillarThresholds: Readonly<Record<Pillar, PillarThresholds>> =
  rulesetData.pillar_thresholds as Readonly<Record<Pillar, PillarThresholds>>

const multiGuidelineDifferences: ReadonlyArray<MultiGuidelineDifference> =
  rulesetData.multi_guideline_differences as ReadonlyArray<MultiGuidelineDifference>

const staleDataThresholds: StaleDataThresholds =
  rulesetData.stale_data_thresholds as StaleDataThresholds

export function getRulesForPillar(
  pillar: Pillar,
  efCategory: EFCategory,
): ReadonlyArray<RulesetEntry> {
  return rules.filter(
    (rule) =>
      rule.pillar === pillar && rule.ef_categories.includes(efCategory),
  )
}

export function getThresholdsForPillar(pillar: Pillar): PillarThresholds {
  return pillarThresholds[pillar]
}

export function getMultiGuidelineDifferences(): ReadonlyArray<MultiGuidelineDifference> {
  return multiGuidelineDifferences
}

export function getStaleDataThresholds(): StaleDataThresholds {
  return staleDataThresholds
}

export function getAllRules(): ReadonlyArray<RulesetEntry> {
  return rules
}
