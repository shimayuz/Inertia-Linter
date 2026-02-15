import { describe, it, expect } from 'vitest'
import { case1Patient } from '../../data/cases/case1.ts'
import { case2Patient } from '../../data/cases/case2.ts'
import { case3Patient } from '../../data/cases/case3.ts'
import { runAudit } from '../audit.ts'
import type { PatientSnapshot } from '../../types/index.ts'

/**
 * Integration tests for the full audit pipeline.
 *
 * All case data files use labsDate/vitalsDate of '2026-02-14' so
 * ref date of '2026-02-14' keeps everything fresh (0 days).
 */

const REF_DATE = new Date('2026-02-14')

describe('runAudit — Case 1: 68M HFrEF EF 30%, clinical inertia + UTI barrier', () => {
  const result = runAudit(case1Patient, REF_DATE)

  it('classifies EF correctly as HFrEF', () => {
    expect(result.efCategory).toBe('HFrEF')
  })

  it('evaluates all 4 pillars', () => {
    expect(result.pillarResults).toHaveLength(4)
  })

  it('ARNI_ACEi_ARB: UNDERDOSED at LOW dose, CLINICAL_INERTIA', () => {
    const arniAcei = result.pillarResults.find((p) => p.pillar === 'ARNI_ACEi_ARB')
    expect(arniAcei).toBeDefined()
    expect(arniAcei!.status).toBe('UNDERDOSED')
    expect(arniAcei!.doseTier).toBe('LOW')
    expect(arniAcei!.blockers).toContain('CLINICAL_INERTIA')
  })

  it('BB: UNDERDOSED at MEDIUM dose, CLINICAL_INERTIA', () => {
    const bb = result.pillarResults.find((p) => p.pillar === 'BETA_BLOCKER')
    expect(bb).toBeDefined()
    expect(bb!.status).toBe('UNDERDOSED')
    expect(bb!.doseTier).toBe('MEDIUM')
    expect(bb!.blockers).toContain('CLINICAL_INERTIA')
  })

  it('MRA: MISSING (NOT_PRESCRIBED), CLINICAL_INERTIA', () => {
    const mra = result.pillarResults.find((p) => p.pillar === 'MRA')
    expect(mra).toBeDefined()
    expect(mra!.status).toBe('MISSING')
    expect(mra!.doseTier).toBe('NOT_PRESCRIBED')
    expect(mra!.blockers).toContain('CLINICAL_INERTIA')
  })

  it('SGLT2i: MISSING (NOT_PRESCRIBED), ADR_HISTORY blocker', () => {
    const sglt2i = result.pillarResults.find((p) => p.pillar === 'SGLT2i')
    expect(sglt2i).toBeDefined()
    expect(sglt2i!.status).toBe('MISSING')
    expect(sglt2i!.doseTier).toBe('NOT_PRESCRIBED')
    expect(sglt2i!.blockers).toContain('ADR_HISTORY')
  })

  it('GDMT score: 24/100 (ARNI_ACEi_ARB LOW 8 + BB MEDIUM 16 + MRA 0 + SGLT2i 0)', () => {
    expect(result.gdmtScore.score).toBe(24)
    expect(result.gdmtScore.maxPossible).toBe(100)
    expect(result.gdmtScore.normalized).toBe(24)
  })

  it('no pillars excluded', () => {
    expect(result.gdmtScore.excludedPillars).toHaveLength(0)
  })

  it('score is not incomplete', () => {
    expect(result.gdmtScore.isIncomplete).toBe(false)
  })

  it('generates nextBestQuestions for CLINICAL_INERTIA and ADR_HISTORY', () => {
    expect(result.nextBestQuestions.length).toBeGreaterThan(0)
    const hasInertiaQ = result.nextBestQuestions.some((q) =>
      q.includes('no identified barrier to optimization'),
    )
    const hasAdrQ = result.nextBestQuestions.some((q) =>
      q.includes('adverse reaction'),
    )
    expect(hasInertiaQ).toBe(true)
    expect(hasAdrQ).toBe(true)
  })

  it('has a timestamp', () => {
    expect(result.timestamp).toBeTruthy()
    expect(() => new Date(result.timestamp)).not.toThrow()
  })
})

describe('runAudit — Case 2: 75F HFpEF EF 58%, multi-guideline', () => {
  const result = runAudit(case2Patient, REF_DATE)

  it('classifies EF correctly as HFpEF', () => {
    expect(result.efCategory).toBe('HFpEF')
  })

  it('evaluates only SGLT2i pillar for HFpEF', () => {
    expect(result.pillarResults).toHaveLength(1)
    expect(result.pillarResults[0].pillar).toBe('SGLT2i')
  })

  it('SGLT2i: MISSING, CLINICAL_INERTIA', () => {
    const sglt2i = result.pillarResults[0]
    expect(sglt2i.status).toBe('MISSING')
    expect(sglt2i.doseTier).toBe('NOT_PRESCRIBED')
    expect(sglt2i.blockers).toContain('CLINICAL_INERTIA')
  })

  it('uses HFpEF scoring (includes T2DM component)', () => {
    // HFpEF score: SGLT2i MISSING=0, BP 142>=130 so no BP points,
    // T2DM present=20 pts, finerenone not included in current scoring
    expect(result.gdmtScore.score).toBe(20)
    expect(result.gdmtScore.maxPossible).toBe(100)
  })

  it('generates nextBestQuestions for CLINICAL_INERTIA', () => {
    const hasQ = result.nextBestQuestions.some((q) =>
      q.includes('SGLT2i'),
    )
    expect(hasQ).toBe(true)
  })

  it('has a timestamp', () => {
    expect(result.timestamp).toBeTruthy()
  })
})

describe('runAudit — Case 3: 72M HFrEF EF 25%, real blockers', () => {
  const result = runAudit(case3Patient, REF_DATE)

  it('classifies EF correctly as HFrEF', () => {
    expect(result.efCategory).toBe('HFrEF')
  })

  it('evaluates all 4 pillars', () => {
    expect(result.pillarResults).toHaveLength(4)
  })

  it('ARNI_ACEi_ARB: UNDERDOSED at LOW dose, BP_LOW blocker (SBP 92 < threshold 100)', () => {
    const arniAcei = result.pillarResults.find((p) => p.pillar === 'ARNI_ACEi_ARB')
    expect(arniAcei).toBeDefined()
    expect(arniAcei!.status).toBe('UNDERDOSED')
    expect(arniAcei!.doseTier).toBe('LOW')
    expect(arniAcei!.blockers).toContain('BP_LOW')
  })

  it('BB: UNDERDOSED at LOW dose, CLINICAL_INERTIA (HR 72 >= 60, SBP 92 >= BB threshold 90)', () => {
    const bb = result.pillarResults.find((p) => p.pillar === 'BETA_BLOCKER')
    expect(bb).toBeDefined()
    expect(bb!.status).toBe('UNDERDOSED')
    expect(bb!.doseTier).toBe('LOW')
    // HR 72 > hr_low 60, SBP 92 >= bp_low_sbp 90 for BB -> no blocker -> CLINICAL_INERTIA
    expect(bb!.blockers).toContain('CLINICAL_INERTIA')
  })

  it('MRA: UNDERDOSED at LOW dose, K_HIGH blocker (K+ 5.3 > threshold 5.0)', () => {
    const mra = result.pillarResults.find((p) => p.pillar === 'MRA')
    expect(mra).toBeDefined()
    expect(mra!.status).toBe('UNDERDOSED')
    expect(mra!.doseTier).toBe('LOW')
    expect(mra!.blockers).toContain('K_HIGH')
  })

  it('SGLT2i: ON_TARGET at HIGH dose, no blockers', () => {
    const sglt2i = result.pillarResults.find((p) => p.pillar === 'SGLT2i')
    expect(sglt2i).toBeDefined()
    expect(sglt2i!.status).toBe('ON_TARGET')
    expect(sglt2i!.doseTier).toBe('HIGH')
    expect(sglt2i!.blockers).toHaveLength(0)
  })

  it('GDMT score: 49/100 (ARNI_ACEi_ARB LOW 8 + BB LOW 8 + MRA LOW 8 + SGLT2i HIGH 25)', () => {
    expect(result.gdmtScore.score).toBe(49)
    expect(result.gdmtScore.maxPossible).toBe(100)
    expect(result.gdmtScore.normalized).toBe(49)
  })

  it('no pillars excluded', () => {
    expect(result.gdmtScore.excludedPillars).toHaveLength(0)
  })

  it('generates nextBestQuestion for BB CLINICAL_INERTIA', () => {
    // BB has CLINICAL_INERTIA (no physiological blocker for BB at SBP 92, HR 72)
    const hasBBQ = result.nextBestQuestions.some((q) =>
      q.includes('Beta-blocker') && q.includes('no identified barrier'),
    )
    expect(hasBBQ).toBe(true)
  })

  it('has a timestamp', () => {
    expect(result.timestamp).toBeTruthy()
  })
})

describe('runAudit — missingInfo aggregation', () => {
  it('deduplicates missingInfo across pillars', () => {
    const patient: PatientSnapshot = {
      ef: 30,
      nyhaClass: 2,
      sbp: 120,
      hr: 70,
      vitalsDate: '2026-02-10',
      egfr: undefined,
      potassium: undefined,
      labsDate: undefined,
      medications: [],
    }

    const result = runAudit(patient, REF_DATE)

    const obtainEgfrCount = result.missingInfo.filter(
      (info) => info === 'Obtain eGFR',
    ).length
    const obtainKCount = result.missingInfo.filter(
      (info) => info === 'Obtain K+',
    ).length

    expect(obtainEgfrCount).toBeLessThanOrEqual(1)
    expect(obtainKCount).toBeLessThanOrEqual(1)
  })

  it('aggregates missingInfo from multiple pillars', () => {
    const patient: PatientSnapshot = {
      ef: 30,
      nyhaClass: 2,
      sbp: 120,
      hr: 70,
      vitalsDate: '2026-02-10',
      egfr: 60,
      potassium: 4.0,
      labsDate: '2026-01-20',
      medications: [],
    }

    const result = runAudit(patient, REF_DATE)

    expect(result.missingInfo.length).toBeGreaterThan(0)
    expect(result.missingInfo).toContain(
      'Update lab values (last obtained >14 days ago)',
    )
  })
})

describe('runAudit — immutability', () => {
  it('does not mutate the input patient snapshot', () => {
    const patient: PatientSnapshot = {
      ef: 30,
      nyhaClass: 2,
      sbp: 120,
      hr: 70,
      vitalsDate: '2026-02-10',
      egfr: 60,
      potassium: 4.0,
      labsDate: '2026-02-10',
      medications: [
        { pillar: 'ARNI_ACEi_ARB', name: 'Lisinopril', doseTier: 'LOW' },
      ],
    }

    const originalEf = patient.ef
    const originalSbp = patient.sbp
    const originalMedsLength = patient.medications.length
    const originalMedName = patient.medications[0].name

    runAudit(patient, REF_DATE)

    expect(patient.ef).toBe(originalEf)
    expect(patient.sbp).toBe(originalSbp)
    expect(patient.medications.length).toBe(originalMedsLength)
    expect(patient.medications[0].name).toBe(originalMedName)
  })
})

describe('runAudit — HFmrEF', () => {
  it('evaluates all 4 pillars for HFmrEF (EF 45%)', () => {
    const patient: PatientSnapshot = {
      ef: 45,
      nyhaClass: 2,
      sbp: 120,
      hr: 70,
      vitalsDate: '2026-02-10',
      egfr: 60,
      potassium: 4.0,
      labsDate: '2026-02-10',
      medications: [],
    }

    const result = runAudit(patient, REF_DATE)

    expect(result.efCategory).toBe('HFmrEF')
    expect(result.pillarResults).toHaveLength(4)
    expect(result.gdmtScore.maxPossible).toBe(100)
  })
})

describe('runAudit — CONTRAINDICATED exclusion', () => {
  it('excludes CONTRAINDICATED ARNI_ACEi_ARB pillar from denominator', () => {
    const patient: PatientSnapshot = {
      ef: 30,
      nyhaClass: 2,
      sbp: 120,
      hr: 70,
      vitalsDate: '2026-02-10',
      egfr: 60,
      potassium: 4.0,
      labsDate: '2026-02-10',
      medications: [
        { pillar: 'SGLT2i', name: 'Dapagliflozin', doseTier: 'HIGH' },
      ],
      history: {
        allergies: ['ARNI_ACEi_ARB'],
      },
    }

    const result = runAudit(patient, REF_DATE)

    const arniAcei = result.pillarResults.find((p) => p.pillar === 'ARNI_ACEi_ARB')
    expect(arniAcei!.status).toBe('CONTRAINDICATED')
    // ARNI_ACEi_ARB excluded → maxPossible = 75
    expect(result.gdmtScore.maxPossible).toBe(75)
  })
})

describe('runAudit — stale data detection', () => {
  it('detects STALE_LABS when labs older than 14 days', () => {
    const patient: PatientSnapshot = {
      ef: 30,
      nyhaClass: 2,
      sbp: 120,
      hr: 70,
      vitalsDate: '2026-02-10',
      egfr: 60,
      potassium: 4.0,
      labsDate: '2026-01-28',
      medications: [],
    }

    // labsDate='2026-01-28', ref 2026-02-14 = 17 days -> STALE
    const result = runAudit(patient, REF_DATE)
    const arniAcei = result.pillarResults.find((p) => p.pillar === 'ARNI_ACEi_ARB')
    expect(arniAcei!.blockers).toContain('STALE_LABS')
  })

  it('does not detect STALE_LABS when labs within 14 days', () => {
    const result = runAudit(case1Patient, REF_DATE)

    // Case 1 labsDate='2026-02-14', ref 2026-02-14 = 0 days -> fresh
    const arniAcei = result.pillarResults.find((p) => p.pillar === 'ARNI_ACEi_ARB')
    expect(arniAcei!.blockers).not.toContain('STALE_LABS')
  })
})
