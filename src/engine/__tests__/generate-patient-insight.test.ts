import { describe, it, expect } from 'vitest'
import { generatePatientInsight } from '../generate-patient-insight'
import type { AuditResult, PillarResult } from '../../types/audit'
import { PILLARS, PILLAR_STATUSES, DOSE_TIERS } from '../../types'

function makePillarResult(
  pillar: PillarResult['pillar'],
  status: PillarResult['status'],
  doseTier: PillarResult['doseTier'],
): PillarResult {
  return {
    pillar,
    status,
    doseTier,
    blockers: [],
    missingInfo: [],
  }
}

function makeAuditResult(
  pillarResults: ReadonlyArray<PillarResult>,
  options: {
    domainId?: string
    efCategory?: AuditResult['efCategory']
    score?: number
    maxPossible?: number
    categoryLabel?: string
    nextBestQuestions?: ReadonlyArray<string>
  } = {},
): AuditResult {
  const { efCategory = 'HFrEF', score = 50, maxPossible = 100, domainId, categoryLabel, nextBestQuestions = [] } = options
  return {
    domainId,
    efCategory,
    categoryLabel,
    pillarResults,
    gdmtScore: {
      score,
      maxPossible,
      normalized: maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0,
      excludedPillars: [],
      isIncomplete: false,
    },
    missingInfo: [],
    nextBestQuestions,
    timestamp: '2026-02-16T00:00:00Z',
  }
}

describe('generatePatientInsight', () => {
  it('returns correct overallScore and maxScore from gdmtScore', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      ],
      { score: 75, maxPossible: 100 },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.overallScore).toBe(75)
    expect(insight.maxScore).toBe(100)
  })

  it('counts pillars on track correctly', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ])

    const insight = generatePatientInsight(audit)

    expect(insight.pillarsOnTrack).toBe(2)
    expect(insight.totalPillars).toBe(4)
  })

  it('returns correct scoreLabel for HF domain', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const insight = generatePatientInsight(audit)

    expect(insight.scoreLabel).toBe('Treatment Optimization Score')
  })

  it('returns DM-specific scoreLabel for diabetes domain', () => {
    const audit = makeAuditResult(
      [makePillarResult(PILLARS.METFORMIN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH)],
      { domainId: 'dm-mgmt' },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.scoreLabel).toBe('Diabetes Management Score')
  })

  it('returns HTN-specific scoreLabel for hypertension domain', () => {
    const audit = makeAuditResult(
      [makePillarResult(PILLARS.ACEi_ARB_HTN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH)],
      { domainId: 'htn-control' },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.scoreLabel).toBe('Blood Pressure Control Score')
  })

  it('uses categoryLabel for domain label when available', () => {
    const audit = makeAuditResult(
      [makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH)],
      { categoryLabel: 'Heart Failure with Reduced EF' },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.domainLabel).toBe('Heart Failure with Reduced EF')
  })

  it('uses domainId mapping for domain label when no categoryLabel', () => {
    const audit = makeAuditResult(
      [makePillarResult(PILLARS.METFORMIN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH)],
      { domainId: 'dm-mgmt' },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.domainLabel).toBe('Diabetes Management')
  })

  it('uses nextBestQuestions[0] as topAction when available', () => {
    const audit = makeAuditResult(
      [makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED)],
      { nextBestQuestions: ['What is the latest eGFR?', 'Check potassium level'] },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.topAction).toBe('What is the latest eGFR?')
  })

  it('generates action for MISSING pillar when no nextBestQuestions', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ])

    const insight = generatePatientInsight(audit)

    expect(insight.topAction).toContain('starting a new treatment')
  })

  it('generates action for UNDERDOSED pillar when no MISSING and no nextBestQuestions', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const insight = generatePatientInsight(audit)

    expect(insight.topAction).toContain('dose adjustments')
  })

  it('returns encouraging message for low score (< 30)', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      ],
      { score: 10, maxPossible: 100 },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.encouragement).toContain('work together')
  })

  it('returns progress message for medium score (30-60)', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      ],
      { score: 45, maxPossible: 100 },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.encouragement).toContain('Good progress')
  })

  it('returns celebration message for high score (> 60)', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      ],
      { score: 85, maxPossible: 100 },
    )

    const insight = generatePatientInsight(audit)

    expect(insight.encouragement).toContain('Great job')
  })

  it('returns fallback topAction when all pillars are on target', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const insight = generatePatientInsight(audit)

    expect(insight.topAction).toContain('Continue')
  })
})
