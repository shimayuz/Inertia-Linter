import { describe, it, expect } from 'vitest'
import { extractClinicalMetrics } from '../extract-clinical-metrics.ts'
import type { PatientSnapshot } from '../../types/patient.ts'

function makePatient(overrides: Partial<PatientSnapshot> = {}): PatientSnapshot {
  return {
    ef: 30,
    nyhaClass: 2,
    sbp: 120,
    hr: 72,
    vitalsDate: '2026-01-15',
    egfr: 65,
    potassium: 4.2,
    labsDate: '2026-01-14',
    medications: [],
    ...overrides,
  }
}

describe('extractClinicalMetrics', () => {
  describe('HF-GDMT domain (hf-gdmt)', () => {
    it('returns 6 metrics for HF domain', () => {
      const patient = makePatient({ domainId: 'hf-gdmt', bnp: 250 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      expect(metrics.length).toBe(6)
    })

    it('marks EF as primary metric', () => {
      const patient = makePatient({ domainId: 'hf-gdmt', bnp: 80 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const primary = metrics.filter((m) => m.isPrimary)
      expect(primary).toHaveLength(1)
      expect(primary[0].id).toBe('hf.ef')
    })

    it('classifies EF > 40 as AT_TARGET', () => {
      const patient = makePatient({ ef: 55 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const ef = metrics.find((m) => m.id === 'hf.ef')
      expect(ef?.status).toBe('at_target')
    })

    it('classifies EF 35-40 as NEAR_TARGET', () => {
      const patient = makePatient({ ef: 38 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const ef = metrics.find((m) => m.id === 'hf.ef')
      expect(ef?.status).toBe('near_target')
    })

    it('classifies EF < 35 as OFF_TARGET', () => {
      const patient = makePatient({ ef: 25 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const ef = metrics.find((m) => m.id === 'hf.ef')
      expect(ef?.status).toBe('off_target')
    })

    it('classifies SBP within 90-130 as AT_TARGET', () => {
      const patient = makePatient({ sbp: 115 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const sbp = metrics.find((m) => m.id === 'hf.sbp')
      expect(sbp?.status).toBe('at_target')
    })

    it('classifies K+ 5.0-5.5 as NEAR_TARGET', () => {
      const patient = makePatient({ potassium: 5.2 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const k = metrics.find((m) => m.id === 'hf.potassium')
      expect(k?.status).toBe('near_target')
    })

    it('prefers BNP when both BNP and NT-proBNP are available', () => {
      const patient = makePatient({ bnp: 250, ntProBnp: 800 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const biomarker = metrics.find((m) => m.id === 'hf.bnp')
      expect(biomarker).toBeDefined()
      expect(biomarker?.value).toBe(250)
    })

    it('uses NT-proBNP when BNP is not available', () => {
      const patient = makePatient({ ntProBnp: 800 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const biomarker = metrics.find((m) => m.id === 'hf.ntProBnp')
      expect(biomarker).toBeDefined()
      expect(biomarker?.value).toBe(800)
    })

    it('classifies eGFR >= 30 as AT_TARGET for HF', () => {
      const patient = makePatient({ egfr: 45 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const egfr = metrics.find((m) => m.id === 'hf.egfr')
      expect(egfr?.status).toBe('at_target')
    })

    it('classifies eGFR 20-30 as NEAR_TARGET for HF', () => {
      const patient = makePatient({ egfr: 25 })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const egfr = metrics.find((m) => m.id === 'hf.egfr')
      expect(egfr?.status).toBe('near_target')
    })
  })

  describe('DM domain (dm-mgmt)', () => {
    it('returns 4 metrics for DM domain', () => {
      const patient = makePatient({
        domainId: 'dm-mgmt',
        hba1c: 7.5,
        fastingGlucose: 150,
        bmi: 28,
      })
      const metrics = extractClinicalMetrics(patient, 'dm-mgmt')
      expect(metrics.length).toBe(4)
    })

    it('marks HbA1c as primary metric', () => {
      const patient = makePatient({ hba1c: 7.5 })
      const metrics = extractClinicalMetrics(patient, 'dm-mgmt')
      const primary = metrics.filter((m) => m.isPrimary)
      expect(primary).toHaveLength(1)
      expect(primary[0].id).toBe('dm.hba1c')
    })

    it('classifies HbA1c < 7.0 as AT_TARGET', () => {
      const patient = makePatient({ hba1c: 6.5 })
      const metrics = extractClinicalMetrics(patient, 'dm-mgmt')
      const hba1c = metrics.find((m) => m.id === 'dm.hba1c')
      expect(hba1c?.status).toBe('at_target')
    })

    it('classifies HbA1c 7.0-8.0 as NEAR_TARGET', () => {
      const patient = makePatient({ hba1c: 7.5 })
      const metrics = extractClinicalMetrics(patient, 'dm-mgmt')
      const hba1c = metrics.find((m) => m.id === 'dm.hba1c')
      expect(hba1c?.status).toBe('near_target')
    })

    it('classifies HbA1c > 8.0 as OFF_TARGET', () => {
      const patient = makePatient({ hba1c: 8.5 })
      const metrics = extractClinicalMetrics(patient, 'dm-mgmt')
      const hba1c = metrics.find((m) => m.id === 'dm.hba1c')
      expect(hba1c?.status).toBe('off_target')
    })

    it('classifies BMI 25-30 as NEAR_TARGET', () => {
      const patient = makePatient({ bmi: 27 })
      const metrics = extractClinicalMetrics(patient, 'dm-mgmt')
      const bmi = metrics.find((m) => m.id === 'dm.bmi')
      expect(bmi?.status).toBe('near_target')
    })
  })

  describe('HTN domain (htn-control)', () => {
    it('returns 4 metrics for HTN domain', () => {
      const patient = makePatient({
        domainId: 'htn-control',
        dbp: 78,
      })
      const metrics = extractClinicalMetrics(patient, 'htn-control')
      expect(metrics.length).toBe(4)
    })

    it('marks BP as primary metric with secondary DBP value', () => {
      const patient = makePatient({ sbp: 125, dbp: 78 })
      const metrics = extractClinicalMetrics(patient, 'htn-control')
      const primary = metrics.filter((m) => m.isPrimary)
      expect(primary).toHaveLength(1)
      expect(primary[0].id).toBe('htn.bp')
      expect(primary[0].secondaryValue).toBe(78)
    })

    it('classifies BP < 130/80 as AT_TARGET', () => {
      const patient = makePatient({ sbp: 125, dbp: 75 })
      const metrics = extractClinicalMetrics(patient, 'htn-control')
      const bp = metrics.find((m) => m.id === 'htn.bp')
      expect(bp?.status).toBe('at_target')
    })

    it('classifies BP 130-140 as NEAR_TARGET', () => {
      const patient = makePatient({ sbp: 135, dbp: 75 })
      const metrics = extractClinicalMetrics(patient, 'htn-control')
      const bp = metrics.find((m) => m.id === 'htn.bp')
      expect(bp?.status).toBe('near_target')
    })

    it('classifies BP > 140 as OFF_TARGET', () => {
      const patient = makePatient({ sbp: 165, dbp: 95 })
      const metrics = extractClinicalMetrics(patient, 'htn-control')
      const bp = metrics.find((m) => m.id === 'htn.bp')
      expect(bp?.status).toBe('off_target')
    })

    it('uses patient-specific BP targets when available', () => {
      const patient = makePatient({ sbp: 138, dbp: 82, targetSBP: 140, targetDBP: 90 })
      const metrics = extractClinicalMetrics(patient, 'htn-control')
      const bp = metrics.find((m) => m.id === 'htn.bp')
      expect(bp?.status).toBe('at_target')
    })
  })

  describe('edge cases', () => {
    it('returns UNKNOWN status for undefined values', () => {
      const patient = makePatient({ hba1c: undefined, fastingGlucose: undefined, bmi: undefined })
      const metrics = extractClinicalMetrics(patient, 'dm-mgmt')
      const hba1c = metrics.find((m) => m.id === 'dm.hba1c')
      expect(hba1c?.status).toBe('unknown')
      expect(hba1c?.value).toBeUndefined()
    })

    it('defaults to hf-gdmt when no domainId provided', () => {
      const patient = makePatient({})
      const metrics = extractClinicalMetrics(patient)
      const ef = metrics.find((m) => m.id === 'hf.ef')
      expect(ef).toBeDefined()
    })

    it('returns immutable array', () => {
      const patient = makePatient({})
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      expect(Object.isFrozen(metrics)).toBe(true)
    })

    it('does not mutate input patient', () => {
      const patient = makePatient({ ef: 30 })
      const originalEf = patient.ef
      extractClinicalMetrics(patient, 'hf-gdmt')
      expect(patient.ef).toBe(originalEf)
    })

    it('returns biomarker metric with UNKNOWN when neither BNP nor NT-proBNP available', () => {
      const patient = makePatient({ bnp: undefined, ntProBnp: undefined })
      const metrics = extractClinicalMetrics(patient, 'hf-gdmt')
      const biomarker = metrics.find((m) => m.id === 'hf.bnp' || m.id === 'hf.ntProBnp')
      expect(biomarker?.status).toBe('unknown')
    })
  })
})
