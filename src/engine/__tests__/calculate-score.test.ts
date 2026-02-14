import { describe, it, expect } from 'vitest'
import { calculateGDMTScore } from '../calculate-score.ts'
import type { PillarResult } from '../../types/index.ts'
import { PILLARS, PILLAR_STATUSES } from '../../types/index.ts'
import { DOSE_TIERS } from '../../types/index.ts'

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

describe('calculateGDMTScore', () => {
  it('returns score=100 when all 4 pillars are HIGH', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(100)
    expect(score.maxPossible).toBe(100)
    expect(score.normalized).toBe(100)
    expect(score.excludedPillars).toEqual([])
    expect(score.isIncomplete).toBe(false)
  })

  it('returns score=0 when all pillars are NOT_PRESCRIBED', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(0)
    expect(score.maxPossible).toBe(100)
    expect(score.normalized).toBe(0)
  })

  it('Case 1: LOW + MEDIUM + NOT_PRESCRIBED + NOT_PRESCRIBED → score=24, normalized=24', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.MEDIUM),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(24)
    expect(score.maxPossible).toBe(100)
    expect(score.normalized).toBe(24)
    expect(score.isIncomplete).toBe(false)
  })

  it('Case 3: LOW + LOW + LOW + HIGH → score=49, normalized=49', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(49)
    expect(score.maxPossible).toBe(100)
    expect(score.normalized).toBe(49)
  })

  it('excludes 1 CONTRAINDICATED pillar from both numerator and denominator', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(75)
    expect(score.maxPossible).toBe(75)
    expect(score.normalized).toBe(100)
    expect(score.excludedPillars).toEqual([PILLARS.MRA])
    expect(score.isIncomplete).toBe(false)
  })

  it('excludes 2 CONTRAINDICATED pillars, normalizes to 100', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(50)
    expect(score.maxPossible).toBe(50)
    expect(score.normalized).toBe(100)
    expect(score.excludedPillars).toEqual([PILLARS.ARNI_ACEi_ARB, PILLARS.MRA])
  })

  it('sets isIncomplete=true when any pillar is UNKNOWN', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNKNOWN, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const score = calculateGDMTScore(results)

    expect(score.isIncomplete).toBe(true)
  })

  it('Mixed: HIGH + LOW + MEDIUM + CONTRAINDICATED → score=49, maxPossible=75, normalized=65', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.MEDIUM),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(49)
    expect(score.maxPossible).toBe(75)
    expect(score.normalized).toBe(65)
    expect(score.excludedPillars).toEqual([PILLARS.SGLT2i])
  })

  it('Mixed: 2 HIGH + 1 LOW + 1 CONTRAINDICATED → score=58, maxPossible=75, normalized=77', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(58)
    expect(score.maxPossible).toBe(75)
    expect(score.normalized).toBe(77)
    expect(score.excludedPillars).toEqual([PILLARS.SGLT2i])
  })

  it('handles empty pillar results array', () => {
    const score = calculateGDMTScore([])

    expect(score.score).toBe(0)
    expect(score.maxPossible).toBe(0)
    expect(score.normalized).toBe(0)
    expect(score.excludedPillars).toEqual([])
    expect(score.isIncomplete).toBe(false)
  })

  it('handles all pillars CONTRAINDICATED', () => {
    const results: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const score = calculateGDMTScore(results)

    expect(score.score).toBe(0)
    expect(score.maxPossible).toBe(0)
    expect(score.normalized).toBe(0)
    expect(score.excludedPillars).toEqual([
      PILLARS.ARNI_ACEi_ARB,
      PILLARS.BETA_BLOCKER,
      PILLARS.MRA,
      PILLARS.SGLT2i,
    ])
  })
})
