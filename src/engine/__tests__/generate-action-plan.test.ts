import { describe, it, expect } from 'vitest'
import { generateActionPlan } from '../generate-action-plan'
import type { AuditResult, PillarResult } from '../../types'
import { PILLARS, PILLAR_STATUSES, DOSE_TIERS } from '../../types'
import { case1Expected } from '../../data/expected/case1-expected'

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
  efCategory: AuditResult['efCategory'] = 'HFrEF',
  score = 0,
  maxPossible = 100,
): AuditResult {
  return {
    efCategory,
    pillarResults,
    gdmtScore: {
      score,
      maxPossible,
      normalized: maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0,
      excludedPillars: [],
      isIncomplete: false,
    },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-15T00:00:00Z',
  }
}

describe('generateActionPlan', () => {
  it('generates initiate action for MISSING pillar with no blockers', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(1)
    expect(actions[0].category).toBe('initiate')
    expect(actions[0].priority).toBe('high')
    expect(actions[0].pillar).toBe(PILLARS.MRA)
    expect(actions[0].title).toContain('MRA')
    expect(actions[0].title).toContain('Consider initiating')
    expect(actions[0].id).toBe('MRA-initiate')
  })

  it('generates initiate action for MISSING pillar with CLINICAL_INERTIA only', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(1)
    expect(actions[0].category).toBe('initiate')
    expect(actions[0].priority).toBe('high')
    expect(actions[0].pillar).toBe(PILLARS.ARNI_ACEi_ARB)
    expect(actions[0].title).toContain('ARNI/ACEi/ARB')
    expect(actions[0].rationale).toContain('No identified contraindication')
  })

  it('generates uptitrate action for UNDERDOSED pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(1)
    expect(actions[0].category).toBe('uptitrate')
    expect(actions[0].priority).toBe('medium')
    expect(actions[0].pillar).toBe(PILLARS.BETA_BLOCKER)
    expect(actions[0].title).toContain('Beta-blocker')
    expect(actions[0].title).toContain('Uptitration opportunity')
    expect(actions[0].id).toBe('BETA_BLOCKER-uptitrate')
  })

  it('generates order_labs action for STALE_LABS blocker', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['STALE_LABS']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(1)
    expect(actions[0].category).toBe('order_labs')
    expect(actions[0].priority).toBe('high')
    expect(actions[0].pillar).toBe(PILLARS.MRA)
    expect(actions[0].title).toContain('Lab results older than 14 days')
    expect(actions[0].id).toBe('MRA-order_labs')
  })

  it('generates order_labs action for UNKNOWN_LABS blocker', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['UNKNOWN_LABS']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(1)
    expect(actions[0].category).toBe('order_labs')
    expect(actions[0].priority).toBe('high')
  })

  it('generates resolve_blocker action for real blocker (BP_LOW)', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['BP_LOW']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(1)
    expect(actions[0].category).toBe('resolve_blocker')
    expect(actions[0].priority).toBe('low')
    expect(actions[0].pillar).toBe(PILLARS.ARNI_ACEi_ARB)
    expect(actions[0].title).toContain('Low blood pressure')
    expect(actions[0].id).toBe('ARNI_ACEi_ARB-resolve_blocker')
  })

  it('generates no action for ON_TARGET pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(0)
  })

  it('generates no action for CONTRAINDICATED pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(0)
  })

  it('caps results at maximum 5 items', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['BP_LOW', 'STALE_LABS']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW, ['HR_LOW']),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['K_HIGH', 'STALE_LABS']),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['ADR_HISTORY', 'UNKNOWN_LABS']),
    ])

    const actions = generateActionPlan(audit)

    expect(actions.length).toBeLessThanOrEqual(5)
  })

  it('sorts actions by priority: high before medium before low', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['BP_LOW']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions.length).toBeGreaterThanOrEqual(3)

    const priorityValues: Readonly<Record<string, number>> = {
      high: 0,
      medium: 1,
      low: 2,
    }

    for (let i = 1; i < actions.length; i++) {
      expect(priorityValues[actions[i].priority]).toBeGreaterThanOrEqual(
        priorityValues[actions[i - 1].priority],
      )
    }
  })

  it('generates reassess action for UNKNOWN pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.UNKNOWN, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions).toHaveLength(1)
    expect(actions[0].category).toBe('reassess')
    expect(actions[0].priority).toBe('medium')
    expect(actions[0].title).toContain('Assessment needed')
  })

  it('generates deterministic IDs based on pillar and category', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions1 = generateActionPlan(audit)
    const actions2 = generateActionPlan(audit)

    expect(actions1[0].id).toBe(actions2[0].id)
    expect(actions1[0].id).toBe('MRA-initiate')
  })

  it('returns readonly array', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(Array.isArray(actions)).toBe(true)
  })

  it('includes evidence and cautions from barrier data when available', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['BP_LOW']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const actions = generateActionPlan(audit)

    expect(actions[0].evidence).toContain('PARADIGM-HF')
    expect(actions[0].cautions.length).toBeGreaterThan(0)
  })

  it('generates correct actions for Case 1 expected audit result', () => {
    const actions = generateActionPlan(case1Expected)

    expect(actions.length).toBeGreaterThanOrEqual(3)
    expect(actions.length).toBeLessThanOrEqual(5)

    const initiateActions = actions.filter((a) => a.category === 'initiate')
    expect(initiateActions.length).toBe(1)
    expect(initiateActions[0].pillar).toBe(PILLARS.MRA)

    const uptitateActions = actions.filter((a) => a.category === 'uptitrate')
    expect(uptitateActions.length).toBe(2)
    const uptitratePillars = uptitateActions.map((a) => a.pillar)
    expect(uptitratePillars).toContain(PILLARS.ARNI_ACEi_ARB)
    expect(uptitratePillars).toContain(PILLARS.BETA_BLOCKER)

    const resolveActions = actions.filter((a) => a.category === 'resolve_blocker')
    expect(resolveActions.length).toBe(1)
    expect(resolveActions[0].pillar).toBe(PILLARS.SGLT2i)

    const highPriorityActions = actions.filter((a) => a.priority === 'high')
    const mediumPriorityActions = actions.filter((a) => a.priority === 'medium')
    const lowPriorityActions = actions.filter((a) => a.priority === 'low')

    expect(highPriorityActions.length).toBe(1)
    expect(mediumPriorityActions.length).toBe(2)
    expect(lowPriorityActions.length).toBe(1)

    const firstHighIdx = actions.findIndex((a) => a.priority === 'high')
    const firstMediumIdx = actions.findIndex((a) => a.priority === 'medium')
    const firstLowIdx = actions.findIndex((a) => a.priority === 'low')

    expect(firstHighIdx).toBeLessThan(firstMediumIdx)
    expect(firstMediumIdx).toBeLessThan(firstLowIdx)
  })
})
