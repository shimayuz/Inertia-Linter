import { describe, it, expect } from 'vitest'
import { detectBlockers } from '../detect-blockers'
import type { PatientSnapshot, Medication } from '../../types'
import { case1Patient } from '../../data/cases/case1'
import { case3Patient } from '../../data/cases/case3'

function daysAgo(days: number, referenceDate: Date): string {
  const d = new Date(referenceDate)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function makePatient(overrides: Partial<PatientSnapshot> = {}): PatientSnapshot {
  return {
    ef: 30,
    nyhaClass: 2,
    sbp: 120,
    hr: 70,
    vitalsDate: new Date().toISOString().split('T')[0],
    egfr: 60,
    potassium: 4.0,
    labsDate: new Date().toISOString().split('T')[0],
    medications: [],
    ...overrides,
  }
}

function makeMed(overrides: Partial<Medication> = {}): Medication {
  return {
    pillar: 'ARNI_ACEi_ARB',
    name: 'Test Drug',
    doseTier: 'LOW',
    ...overrides,
  }
}

describe('detectBlockers', () => {
  const refDate = new Date('2026-02-15')

  describe('Hemodynamic blockers', () => {
    it('returns BP_LOW when SBP=95 for ARNI (threshold 100)', () => {
      const patient = makePatient({ sbp: 95 })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).toContain('BP_LOW')
    })

    it('does NOT return BP_LOW when SBP=100 for ARNI (boundary: < 100)', () => {
      const patient = makePatient({ sbp: 100 })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).not.toContain('BP_LOW')
    })

    it('returns BP_LOW when SBP=85 for BB (threshold 90)', () => {
      const patient = makePatient({ sbp: 85 })
      const result = detectBlockers(patient, 'BETA_BLOCKER', true, refDate)
      expect(result).toContain('BP_LOW')
    })

    it('returns HR_LOW when HR=55 for BB (threshold 60)', () => {
      const patient = makePatient({ hr: 55 })
      const result = detectBlockers(patient, 'BETA_BLOCKER', true, refDate)
      expect(result).toContain('HR_LOW')
    })

    it('does NOT return HR_LOW when HR=60 for BB (boundary: < 60)', () => {
      const patient = makePatient({ hr: 60 })
      const result = detectBlockers(patient, 'BETA_BLOCKER', true, refDate)
      expect(result).not.toContain('HR_LOW')
    })

    it('HR check is not applicable for SGLT2i', () => {
      const patient = makePatient({ hr: 40 })
      const result = detectBlockers(patient, 'SGLT2i', true, refDate)
      expect(result).not.toContain('HR_LOW')
    })
  })

  describe('Metabolic blockers', () => {
    it('returns K_HIGH when K+=5.3 for MRA (threshold 5.0)', () => {
      const patient = makePatient({ potassium: 5.3 })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).toContain('K_HIGH')
    })

    it('does NOT return K_HIGH when K+=5.0 for MRA (boundary: > 5.0, not >=)', () => {
      const patient = makePatient({ potassium: 5.0 })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).not.toContain('K_HIGH')
    })

    it('does NOT return K_HIGH for BB (K+ check not applicable)', () => {
      const patient = makePatient({ potassium: 5.5 })
      const result = detectBlockers(patient, 'BETA_BLOCKER', true, refDate)
      expect(result).not.toContain('K_HIGH')
    })
  })

  describe('Renal blockers', () => {
    it('returns EGFR_LOW_INIT when eGFR=25 for MRA initiation (threshold 30)', () => {
      const patient = makePatient({ egfr: 25 })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).toContain('EGFR_LOW_INIT')
    })

    it('does NOT return EGFR_LOW_INIT when eGFR=30 for MRA initiation (boundary)', () => {
      const patient = makePatient({ egfr: 30 })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).not.toContain('EGFR_LOW_INIT')
    })

    it('returns EGFR_LOW_CONT when eGFR=18 for MRA continuation (threshold 20)', () => {
      const patient = makePatient({ egfr: 18 })
      const result = detectBlockers(patient, 'MRA', false, refDate)
      expect(result).toContain('EGFR_LOW_CONT')
    })

    it('returns EGFR_LOW_INIT when eGFR=15 for SGLT2i initiation (threshold 20)', () => {
      const patient = makePatient({ egfr: 15 })
      const result = detectBlockers(patient, 'SGLT2i', true, refDate)
      expect(result).toContain('EGFR_LOW_INIT')
    })

    it('returns RECENT_AKI when patient has recentAKI flag', () => {
      const patient = makePatient({
        history: { recentAKI: true },
      })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).toContain('RECENT_AKI')
    })

    it('does NOT return RECENT_AKI when recentAKI is false', () => {
      const patient = makePatient({
        history: { recentAKI: false },
      })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).not.toContain('RECENT_AKI')
    })
  })

  describe('Data gap blockers', () => {
    it('returns UNKNOWN_LABS when eGFR is undefined', () => {
      const patient = makePatient({ egfr: undefined })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).toContain('UNKNOWN_LABS')
    })

    it('returns UNKNOWN_LABS when K+ is undefined for MRA', () => {
      const patient = makePatient({ potassium: undefined })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).toContain('UNKNOWN_LABS')
    })

    it('returns STALE_LABS when labs are older than 14 days', () => {
      const patient = makePatient({
        labsDate: daysAgo(15, refDate),
      })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).toContain('STALE_LABS')
    })

    it('does NOT return STALE_LABS when labs are exactly 14 days old', () => {
      const patient = makePatient({
        labsDate: daysAgo(14, refDate),
      })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).not.toContain('STALE_LABS')
    })

    it('returns STALE_VITALS when vitals are older than 30 days', () => {
      const patient = makePatient({
        vitalsDate: daysAgo(31, refDate),
      })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).toContain('STALE_VITALS')
    })

    it('does NOT return STALE_VITALS when vitals are exactly 30 days old', () => {
      const patient = makePatient({
        vitalsDate: daysAgo(30, refDate),
      })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).not.toContain('STALE_VITALS')
    })
  })

  describe('ADR/Allergy blockers', () => {
    it('returns ADR_HISTORY when medication has hasADR=true for pillar', () => {
      const patient = makePatient({
        medications: [makeMed({ pillar: 'SGLT2i', hasADR: true })],
      })
      const result = detectBlockers(patient, 'SGLT2i', true, refDate)
      expect(result).toContain('ADR_HISTORY')
    })

    it('returns ALLERGY when medication has hasAllergy=true for pillar', () => {
      const patient = makePatient({
        medications: [makeMed({ pillar: 'MRA', hasAllergy: true })],
      })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).toContain('ALLERGY')
    })

    it('returns ADR_HISTORY from patient history adrHistory', () => {
      const patient = makePatient({
        history: {
          adrHistory: { SGLT2i: 'UTI' },
        },
      })
      const result = detectBlockers(patient, 'SGLT2i', true, refDate)
      expect(result).toContain('ADR_HISTORY')
    })

    it('returns ALLERGY from patient history allergies', () => {
      const patient = makePatient({
        history: {
          allergies: ['ARNI_ACEi_ARB'],
        },
      })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).toContain('ALLERGY')
    })
  })

  describe('Behavioral/Access blockers', () => {
    it('returns CLINICAL_INERTIA when no other blocker found', () => {
      const patient = makePatient({
        sbp: 120,
        hr: 70,
        egfr: 60,
        potassium: 4.0,
      })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).toEqual(['CLINICAL_INERTIA'])
    })

    it('does NOT return CLINICAL_INERTIA when real blockers exist', () => {
      const patient = makePatient({ sbp: 85 })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).not.toContain('CLINICAL_INERTIA')
    })

    it('returns PATIENT_REFUSAL when medication has patientRefusal=true', () => {
      const patient = makePatient({
        medications: [makeMed({ pillar: 'MRA', patientRefusal: true })],
      })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).toContain('PATIENT_REFUSAL')
    })

    it('returns COST_BARRIER when medication has costBarrier=true', () => {
      const patient = makePatient({
        medications: [makeMed({ pillar: 'SGLT2i', costBarrier: true })],
      })
      const result = detectBlockers(patient, 'SGLT2i', true, refDate)
      expect(result).toContain('COST_BARRIER')
    })
  })

  describe('Multiple blockers', () => {
    it('returns multiple blockers for SBP=88, K+=5.4, eGFR=18 on MRA', () => {
      const patient = makePatient({
        sbp: 88,
        potassium: 5.4,
        egfr: 18,
      })
      const result = detectBlockers(patient, 'MRA', true, refDate)
      expect(result).toContain('K_HIGH')
      expect(result).toContain('EGFR_LOW_INIT')
      expect(result).not.toContain('CLINICAL_INERTIA')
    })

    it('includes stale data blockers alongside hemodynamic blockers', () => {
      const patient = makePatient({
        sbp: 85,
        labsDate: daysAgo(15, refDate),
        vitalsDate: daysAgo(31, refDate),
      })
      const result = detectBlockers(patient, 'ARNI_ACEi_ARB', true, refDate)
      expect(result).toContain('BP_LOW')
      expect(result).toContain('STALE_LABS')
      expect(result).toContain('STALE_VITALS')
      expect(result).not.toContain('CLINICAL_INERTIA')
    })
  })

  describe('Case validations', () => {
    it('Case 1 ARNI: returns CLINICAL_INERTIA (no blockers)', () => {
      const result = detectBlockers(case1Patient, 'ARNI_ACEi_ARB', false, refDate)
      expect(result).toEqual(['CLINICAL_INERTIA'])
    })

    it('Case 1 SGLT2i: returns ADR_HISTORY', () => {
      const result = detectBlockers(case1Patient, 'SGLT2i', true, refDate)
      expect(result).toContain('ADR_HISTORY')
      expect(result).not.toContain('CLINICAL_INERTIA')
    })

    it('Case 3 ARNI: returns BP_LOW', () => {
      const result = detectBlockers(case3Patient, 'ARNI_ACEi_ARB', false, refDate)
      expect(result).toContain('BP_LOW')
      expect(result).not.toContain('CLINICAL_INERTIA')
    })

    it('Case 3 MRA: returns K_HIGH', () => {
      const result = detectBlockers(case3Patient, 'MRA', false, refDate)
      expect(result).toContain('K_HIGH')
      expect(result).not.toContain('CLINICAL_INERTIA')
    })
  })
})
