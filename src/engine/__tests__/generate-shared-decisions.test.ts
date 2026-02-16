import { describe, it, expect } from 'vitest'
import { generateSharedDecisions } from '../generate-shared-decisions'
import type { AuditResult, PillarResult } from '../../types/audit'
import { PILLARS, PILLAR_STATUSES, DOSE_TIERS } from '../../types'

function makePillarResult(
  pillar: PillarResult['pillar'],
  status: PillarResult['status'],
  doseTier: PillarResult['doseTier'],
  blockers: ReadonlyArray<string> = [],
): PillarResult {
  return {
    pillar,
    status,
    doseTier,
    blockers: blockers as ReadonlyArray<PillarResult['blockers'][number]>,
    missingInfo: [],
  }
}

function makeAuditResult(
  pillarResults: ReadonlyArray<PillarResult>,
  options: { domainId?: string; efCategory?: AuditResult['efCategory'] } = {},
): AuditResult {
  const { efCategory = 'HFrEF', domainId } = options
  return {
    domainId,
    efCategory,
    pillarResults,
    gdmtScore: {
      score: 50,
      maxPossible: 100,
      normalized: 50,
      excludedPillars: [],
      isIncomplete: false,
    },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-16T00:00:00Z',
  }
}

describe('generateSharedDecisions', () => {
  it('generates decision context for MISSING HF pillar without hard exclusions', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(1)
    expect(decisions[0].pillar).toBe(PILLARS.MRA)
    expect(decisions[0].currentStatus).toBe('MISSING')
    expect(decisions[0].question).toContain('MRA')
    expect(decisions[0].options.length).toBeGreaterThan(0)
    expect(decisions[0].riskWithout).toBeTruthy()
    expect(decisions[0].benefitWith).toBeTruthy()
  })

  it('does not generate decision context for CONTRAINDICATED pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(0)
  })

  it('does not generate decision context for ALLERGY blocker', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['ALLERGY']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(0)
  })

  it('does not generate decision context for ON_TARGET pillars', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(0)
  })

  it('does not generate decision context for UNDERDOSED pillars', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(0)
  })

  it('generates ARNI/ACEi/ARB options for HF ARNI_ACEi_ARB pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(1)
    expect(decisions[0].options.length).toBe(3)
    const titles = decisions[0].options.map((o) => o.title)
    expect(titles.some((t) => t.includes('ARNI'))).toBe(true)
    expect(titles.some((t) => t.includes('ACE'))).toBe(true)
    expect(titles.some((t) => t.includes('ARB'))).toBe(true)
  })

  it('generates SGLT2i options for HF SGLT2i pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(1)
    expect(decisions[0].options.length).toBe(2)
    const titles = decisions[0].options.map((o) => o.title)
    expect(titles.some((t) => t.includes('Dapagliflozin'))).toBe(true)
    expect(titles.some((t) => t.includes('Empagliflozin'))).toBe(true)
  })

  it('includes cost estimates and evidence levels in options', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    for (const option of decisions[0].options) {
      expect(option.costEstimate).toBeTruthy()
      expect(option.evidenceLevel).toBeTruthy()
      expect(option.pros.length).toBeGreaterThan(0)
      expect(option.cons.length).toBeGreaterThan(0)
    }
  })

  it('generates DM-specific options for diabetes domain', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.METFORMIN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.SGLT2i_DM, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.GLP1_RA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.MEDIUM),
        makePillarResult(PILLARS.INSULIN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.MEDIUM),
      ],
      { domainId: 'dm-mgmt' },
    )

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(1)
    expect(decisions[0].pillar).toBe(PILLARS.SGLT2i_DM)
    expect(decisions[0].question).toContain('diabetes medication')
  })

  it('generates HTN-specific options for hypertension domain', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.ACEi_ARB_HTN, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.CCB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.THIAZIDE, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.BETA_BLOCKER_HTN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      ],
      { domainId: 'htn-control' },
    )

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(1)
    expect(decisions[0].pillar).toBe(PILLARS.ACEi_ARB_HTN)
    expect(decisions[0].question).toContain('blood pressure')
  })

  it('generates multiple decision contexts for multiple MISSING pillars', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(2)
    expect(decisions[0].pillar).toBe(PILLARS.ARNI_ACEi_ARB)
    expect(decisions[1].pillar).toBe(PILLARS.BETA_BLOCKER)
  })

  it('allows MISSING pillar with non-exclusion blocker (BP_LOW)', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['BP_LOW']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(decisions).toHaveLength(1)
    expect(decisions[0].pillar).toBe(PILLARS.ARNI_ACEi_ARB)
  })

  it('returns readonly array', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const decisions = generateSharedDecisions(audit)

    expect(Array.isArray(decisions)).toBe(true)
  })
})
