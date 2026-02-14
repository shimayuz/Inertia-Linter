import { describe, it, expect } from 'vitest'
import { calculateHFpEFScore } from '../hfpef-score.ts'
import type { PatientSnapshot, PillarResult } from '../../types/index.ts'
import { PILLARS, PILLAR_STATUSES, DOSE_TIERS } from '../../types/index.ts'

function makePatient(overrides: Partial<PatientSnapshot> = {}): PatientSnapshot {
  return {
    ef: 58,
    nyhaClass: 2,
    sbp: 140,
    hr: 72,
    vitalsDate: '2026-02-01',
    egfr: 65,
    potassium: 4.2,
    labsDate: '2026-02-01',
    medications: [],
    ...overrides,
  }
}

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

describe('calculateHFpEFScore', () => {
  it('returns label "HFpEF Management Score"', () => {
    const patient = makePatient()
    const pillarResults: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const result = calculateHFpEFScore(patient, pillarResults)

    expect(result.label).toBe('HFpEF Management Score')
  })

  it('Case 2: SGLT2i MISSING + BP uncontrolled → low score', () => {
    const patient = makePatient({ sbp: 145 })
    const pillarResults: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const result = calculateHFpEFScore(patient, pillarResults)

    expect(result.score).toBe(0)
    expect(result.maxPossible).toBe(100)
  })

  it('SGLT2i HIGH + BP controlled → high score', () => {
    const patient = makePatient({ sbp: 125 })
    const pillarResults: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const result = calculateHFpEFScore(patient, pillarResults)

    expect(result.score).toBe(60)
    expect(result.maxPossible).toBe(100)
  })

  it('SGLT2i HIGH + BP controlled + on loop diuretic → higher score', () => {
    const patient = makePatient({
      sbp: 125,
      medications: [
        { pillar: PILLARS.SGLT2i, name: 'dapagliflozin', doseTier: DOSE_TIERS.HIGH },
      ],
    })
    const pillarResults: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const result = calculateHFpEFScore(patient, pillarResults)

    expect(result.score).toBe(60)
    expect(result.maxPossible).toBe(100)
  })

  it('SGLT2i LOW + BP controlled → partial SGLT2i credit', () => {
    const patient = makePatient({ sbp: 120 })
    const pillarResults: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
    ]

    const result = calculateHFpEFScore(patient, pillarResults)

    expect(result.score).toBeGreaterThan(20)
    expect(result.score).toBeLessThan(60)
  })

  it('all criteria met → maximum score', () => {
    const patient = makePatient({
      sbp: 120,
      dmType: 'type2',
    })
    const pillarResults: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ]

    const result = calculateHFpEFScore(patient, pillarResults)

    expect(result.score).toBe(80)
    expect(result.maxPossible).toBe(100)
  })

  it('returns 0 score when no criteria met', () => {
    const patient = makePatient({ sbp: 150 })
    const pillarResults: ReadonlyArray<PillarResult> = [
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ]

    const result = calculateHFpEFScore(patient, pillarResults)

    expect(result.score).toBe(0)
  })
})
