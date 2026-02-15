import { describe, it, expect } from 'vitest'
import { generateConversationStarters } from '../generate-starters'
import type { AuditResult, PillarResult } from '../../types'
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
  efCategory: AuditResult['efCategory'] = 'HFrEF',
): AuditResult {
  return {
    efCategory,
    pillarResults,
    gdmtScore: {
      score: 0,
      maxPossible: 100,
      normalized: 0,
      excludedPillars: [],
      isIncomplete: false,
    },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-15T00:00:00Z',
  }
}

describe('generateConversationStarters', () => {
  it('generates a gap starter for MISSING pillar with CLINICAL_INERTIA blocker', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const starters = generateConversationStarters(audit)

    const gapStarter = starters.find((s) => s.category === 'gap')
    expect(gapStarter).toBeDefined()
    expect(gapStarter!.label).toContain('SGLT2i')
    expect(gapStarter!.prompt).toContain('SGLT2i')
    expect(gapStarter!.prompt).toContain('HFrEF')
  })

  it('generates an opportunity starter for UNDERDOSED pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const starters = generateConversationStarters(audit)

    const oppStarter = starters.find((s) => s.category === 'opportunity')
    expect(oppStarter).toBeDefined()
    expect(oppStarter!.label).toContain('Beta-blocker')
    expect(oppStarter!.prompt).toContain('Beta-blocker')
    expect(oppStarter!.prompt).toContain('target dose')
  })

  it('generates a blocker starter for pillar with real blockers', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['K_HIGH']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const starters = generateConversationStarters(audit)

    const blockerStarter = starters.find((s) => s.category === 'blocker')
    expect(blockerStarter).toBeDefined()
    expect(blockerStarter!.label).toContain('K_HIGH')
    expect(blockerStarter!.label).toContain('MRA')
    expect(blockerStarter!.prompt).toContain('K_HIGH')
    expect(blockerStarter!.prompt).toContain('MRA')
  })

  it('limits results to 4 starters maximum', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW, ['BP_LOW']),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['K_HIGH', 'EGFR_LOW_INIT']),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['ADR_HISTORY']),
    ])

    const starters = generateConversationStarters(audit)

    expect(starters.length).toBeLessThanOrEqual(4)
  })

  it('prioritizes gap > blocker > opportunity', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['BP_LOW']),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.MEDIUM),
    ])

    const starters = generateConversationStarters(audit)

    expect(starters.length).toBeGreaterThanOrEqual(3)

    const categories = starters.map((s) => s.category)
    const gapIdx = categories.indexOf('gap')
    const blockerIdx = categories.indexOf('blocker')
    const opportunityIdx = categories.indexOf('opportunity')

    if (gapIdx !== -1 && blockerIdx !== -1) {
      expect(gapIdx).toBeLessThan(blockerIdx)
    }
    if (blockerIdx !== -1 && opportunityIdx !== -1) {
      expect(blockerIdx).toBeLessThan(opportunityIdx)
    }
  })

  it('produces no starters for ON_TARGET pillars', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const starters = generateConversationStarters(audit)

    expect(starters).toHaveLength(0)
  })

  it('produces no starters for CONTRAINDICATED pillars', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
    ])

    const starters = generateConversationStarters(audit)

    expect(starters).toHaveLength(0)
  })

  it('generates blocker starters for each real blocker on a pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['K_HIGH', 'EGFR_LOW_INIT']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const starters = generateConversationStarters(audit)

    const blockerStarters = starters.filter((s) => s.category === 'blocker')
    expect(blockerStarters.length).toBeGreaterThanOrEqual(1)
    expect(blockerStarters.some((s) => s.label.includes('K_HIGH'))).toBe(true)
  })

  it('uses human-readable pillar labels from PILLAR_LABELS', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const starters = generateConversationStarters(audit)

    const gapStarter = starters.find((s) => s.category === 'gap')
    expect(gapStarter).toBeDefined()
    expect(gapStarter!.label).toContain('ARNI/ACEi/ARB')
    expect(gapStarter!.prompt).toContain('ARNI/ACEi/ARB')
  })

  it('returns readonly array', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['CLINICAL_INERTIA']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])

    const starters = generateConversationStarters(audit)

    expect(Array.isArray(starters)).toBe(true)
  })
})
