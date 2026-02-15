import { describe, it, expect } from 'vitest'
import { deriveMascotEmotion } from '../derive-mascot-emotion'
import type { AuditResult, PillarResult } from '../../types'
import { PILLARS, PILLAR_STATUSES, DOSE_TIERS } from '../../types'
import { MASCOT_EMOTIONS } from '../../types/mascot'

function makePillarResult(
  pillar: PillarResult['pillar'],
  status: PillarResult['status'],
  doseTier: PillarResult['doseTier'] = DOSE_TIERS.HIGH,
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
  score = 0,
  maxPossible = 100,
): AuditResult {
  return {
    efCategory: 'HFrEF',
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

function makeAllOnTargetPillars(): ReadonlyArray<PillarResult> {
  return [
    makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET),
    makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET),
    makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET),
    makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET),
  ]
}

describe('deriveMascotEmotion', () => {
  it('returns IDLE when no audit result, not loading, not hovered', () => {
    const result = deriveMascotEmotion({
      auditResult: null,
      isLoading: false,
      isHovered: false,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.IDLE)
  })

  it('returns THINKING when isLoading is true', () => {
    const result = deriveMascotEmotion({
      auditResult: null,
      isLoading: true,
      isHovered: false,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.THINKING)
  })

  it('returns HAPPY when isHovered is true (even if isLoading is also true)', () => {
    const result = deriveMascotEmotion({
      auditResult: null,
      isLoading: true,
      isHovered: true,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.HAPPY)
  })

  it('returns CELEBRATING when normalized score > 70', () => {
    const audit = makeAuditResult(makeAllOnTargetPillars(), 80, 100)

    const result = deriveMascotEmotion({
      auditResult: audit,
      isLoading: false,
      isHovered: false,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.CELEBRATING)
  })

  it('returns CONCERNED when any pillar status is MISSING', () => {
    const pillars: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET),
    ]
    const audit = makeAuditResult(pillars, 30, 100)

    const result = deriveMascotEmotion({
      auditResult: audit,
      isLoading: false,
      isHovered: false,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.CONCERNED)
  })

  it('returns POINTING when hasUndecidedActions is true and no MISSING pillars', () => {
    const audit = makeAuditResult(makeAllOnTargetPillars(), 50, 100)

    const result = deriveMascotEmotion({
      auditResult: audit,
      isLoading: false,
      isHovered: false,
      hasUndecidedActions: true,
    })

    expect(result).toBe(MASCOT_EMOTIONS.POINTING)
  })

  it('returns IDLE as fallback when audit exists with moderate score, no MISSING, no undecided actions', () => {
    const audit = makeAuditResult(makeAllOnTargetPillars(), 50, 100)

    const result = deriveMascotEmotion({
      auditResult: audit,
      isLoading: false,
      isHovered: false,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.IDLE)
  })

  it('priority: HAPPY overrides THINKING', () => {
    const result = deriveMascotEmotion({
      auditResult: null,
      isLoading: true,
      isHovered: true,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.HAPPY)
  })

  it('priority: CELEBRATING overrides CONCERNED (score > 70 but has MISSING)', () => {
    const pillars: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET),
    ]
    const audit = makeAuditResult(pillars, 75, 100)

    const result = deriveMascotEmotion({
      auditResult: audit,
      isLoading: false,
      isHovered: false,
      hasUndecidedActions: false,
    })

    expect(result).toBe(MASCOT_EMOTIONS.CELEBRATING)
  })
})
