import { describe, it, expect } from 'vitest'
import { evaluatePillar } from '../evaluate-pillar.ts'
import type { PatientSnapshot } from '../../types/index.ts'
import { case3Patient } from '../../data/cases/case3.ts'

/** Original HF Case 1: 68M HFrEF EF 30% (inlined -- case1.ts is now DM domain) */
const hfCase1Patient: PatientSnapshot = {
  ef: 30,
  nyhaClass: 2,
  sbp: 118,
  hr: 68,
  vitalsDate: '2026-02-14',
  egfr: 55,
  potassium: 4.2,
  labsDate: '2026-02-14',
  bnp: 450,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Enalapril 5mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 12.5mg', doseTier: 'MEDIUM' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    {
      pillar: 'SGLT2i',
      name: '',
      doseTier: 'NOT_PRESCRIBED',
      hasADR: true,
      adrDescription: 'Recurrent UTIs',
    },
  ],
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

describe('evaluatePillar', () => {
  describe('ON_TARGET', () => {
    it('returns ON_TARGET for patient on SGLT2i HIGH dose', () => {
      const patient = makePatient({
        medications: [
          { pillar: 'SGLT2i', name: 'Dapagliflozin', doseTier: 'HIGH' },
        ],
      })

      const result = evaluatePillar(patient, 'SGLT2i')

      expect(result.pillar).toBe('SGLT2i')
      expect(result.status).toBe('ON_TARGET')
      expect(result.doseTier).toBe('HIGH')
    })

    it('returns ON_TARGET for patient on ARNI_ACEi_ARB HIGH dose', () => {
      const patient = makePatient({
        medications: [
          { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan', doseTier: 'HIGH' },
        ],
      })

      const result = evaluatePillar(patient, 'ARNI_ACEi_ARB')

      expect(result.pillar).toBe('ARNI_ACEi_ARB')
      expect(result.status).toBe('ON_TARGET')
      expect(result.doseTier).toBe('HIGH')
    })
  })

  describe('UNDERDOSED', () => {
    it('returns UNDERDOSED for patient on Enalapril LOW', () => {
      const patient = makePatient({
        medications: [
          { pillar: 'ARNI_ACEi_ARB', name: 'Enalapril', doseTier: 'LOW' },
        ],
      })

      const result = evaluatePillar(patient, 'ARNI_ACEi_ARB')

      expect(result.pillar).toBe('ARNI_ACEi_ARB')
      expect(result.status).toBe('UNDERDOSED')
      expect(result.doseTier).toBe('LOW')
    })

    it('returns UNDERDOSED for patient on Carvedilol MEDIUM', () => {
      const patient = makePatient({
        medications: [
          { pillar: 'BETA_BLOCKER', name: 'Carvedilol', doseTier: 'MEDIUM' },
        ],
      })

      const result = evaluatePillar(patient, 'BETA_BLOCKER')

      expect(result.pillar).toBe('BETA_BLOCKER')
      expect(result.status).toBe('UNDERDOSED')
      expect(result.doseTier).toBe('MEDIUM')
    })
  })

  describe('MISSING', () => {
    it('returns MISSING when no MRA med, no contraindication, vitals OK', () => {
      const patient = makePatient({
        medications: [],
      })

      const result = evaluatePillar(patient, 'MRA')

      expect(result.pillar).toBe('MRA')
      expect(result.status).toBe('MISSING')
      expect(result.doseTier).toBe('NOT_PRESCRIBED')
    })

    it('returns MISSING with ADR_HISTORY blocker when no SGLT2i and has ADR history', () => {
      const patient = makePatient({
        medications: [],
        history: {
          adrHistory: {
            SGLT2i: 'UTI — stopped 3 months ago',
          },
        },
      })

      const result = evaluatePillar(patient, 'SGLT2i')

      expect(result.pillar).toBe('SGLT2i')
      expect(result.status).toBe('MISSING')
      expect(result.doseTier).toBe('NOT_PRESCRIBED')
      expect(result.blockers).toContain('ADR_HISTORY')
    })
  })

  describe('CONTRAINDICATED', () => {
    it('returns CONTRAINDICATED when patient has ALLERGY on a pillar', () => {
      const patient = makePatient({
        medications: [],
        history: {
          allergies: ['ARNI_ACEi_ARB'],
        },
      })

      const result = evaluatePillar(patient, 'ARNI_ACEi_ARB')

      expect(result.pillar).toBe('ARNI_ACEi_ARB')
      expect(result.status).toBe('CONTRAINDICATED')
      expect(result.blockers).toContain('ALLERGY')
    })
  })

  describe('UNKNOWN', () => {
    it('returns UNKNOWN when missing eGFR and K+ for MRA (insufficient data)', () => {
      const patient = makePatient({
        medications: [],
        egfr: undefined,
        potassium: undefined,
        labsDate: undefined,
      })

      const result = evaluatePillar(patient, 'MRA')

      expect(result.pillar).toBe('MRA')
      expect(result.status).toBe('UNKNOWN')
      expect(result.blockers).toContain('UNKNOWN_LABS')
    })
  })

  describe('missingInfo generation', () => {
    it('generates missingInfo for UNKNOWN_LABS blocker with missing eGFR', () => {
      const patient = makePatient({
        medications: [],
        egfr: undefined,
        potassium: 4.0,
        labsDate: undefined,
      })

      const result = evaluatePillar(patient, 'MRA')

      expect(result.missingInfo).toContain('Obtain eGFR')
    })

    it('generates missingInfo for UNKNOWN_LABS blocker with missing K+', () => {
      const patient = makePatient({
        medications: [],
        egfr: 60,
        potassium: undefined,
        labsDate: undefined,
      })

      const result = evaluatePillar(patient, 'MRA')

      expect(result.missingInfo).toContain('Obtain K+')
    })

    it('generates missingInfo for UNKNOWN_LABS blocker with both missing', () => {
      const patient = makePatient({
        medications: [],
        egfr: undefined,
        potassium: undefined,
        labsDate: undefined,
      })

      const result = evaluatePillar(patient, 'MRA')

      expect(result.missingInfo).toContain('Obtain eGFR')
      expect(result.missingInfo).toContain('Obtain K+')
    })

    it('generates missingInfo for STALE_LABS', () => {
      const staleDate = new Date()
      staleDate.setDate(staleDate.getDate() - 20)
      const patient = makePatient({
        medications: [],
        labsDate: staleDate.toISOString().split('T')[0],
      })

      const result = evaluatePillar(patient, 'MRA')

      expect(result.missingInfo).toContain(
        'Update lab values (last obtained >14 days ago)'
      )
    })

    it('generates missingInfo for STALE_VITALS', () => {
      const staleDate = new Date()
      staleDate.setDate(staleDate.getDate() - 35)
      const patient = makePatient({
        medications: [],
        vitalsDate: staleDate.toISOString().split('T')[0],
      })

      const result = evaluatePillar(patient, 'MRA')

      expect(result.missingInfo).toContain(
        'Update vital signs (last obtained >30 days ago)'
      )
    })
  })

  describe('immutability', () => {
    it('returns a new PillarResult object, does not mutate patient', () => {
      const patient = makePatient({
        medications: [
          { pillar: 'SGLT2i', name: 'Dapagliflozin', doseTier: 'HIGH' },
        ],
      })

      const originalMeds = [...patient.medications]
      const result = evaluatePillar(patient, 'SGLT2i')

      expect(patient.medications).toEqual(originalMeds)
      expect(result).toHaveProperty('pillar')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('doseTier')
      expect(result).toHaveProperty('blockers')
      expect(result).toHaveProperty('missingInfo')
    })
  })

  describe('Case validation', () => {
    const refDate = new Date('2026-02-14')

    it('Case 1 ARNI_ACEi_ARB: UNDERDOSED, LOW, includes CLINICAL_INERTIA', () => {
      const result = evaluatePillar(hfCase1Patient, 'ARNI_ACEi_ARB', refDate)

      expect(result.status).toBe('UNDERDOSED')
      expect(result.doseTier).toBe('LOW')
      expect(result.blockers).toContain('CLINICAL_INERTIA')
    })

    it('Case 1 SGLT2i: MISSING, NOT_PRESCRIBED, includes ADR_HISTORY', () => {
      const result = evaluatePillar(hfCase1Patient, 'SGLT2i', refDate)

      expect(result.status).toBe('MISSING')
      expect(result.doseTier).toBe('NOT_PRESCRIBED')
      expect(result.blockers).toContain('ADR_HISTORY')
    })

    it('Case 3 ARNI_ACEi_ARB: UNDERDOSED, LOW, includes BP_LOW', () => {
      const result = evaluatePillar(case3Patient, 'ARNI_ACEi_ARB')

      expect(result.status).toBe('UNDERDOSED')
      expect(result.doseTier).toBe('LOW')
      expect(result.blockers).toContain('BP_LOW')
    })

    it('Case 3 SGLT2i: ON_TARGET, HIGH, no blockers', () => {
      const result = evaluatePillar(case3Patient, 'SGLT2i')

      expect(result.status).toBe('ON_TARGET')
      expect(result.doseTier).toBe('HIGH')
      expect(result.blockers).toHaveLength(0)
    })
  })
})
