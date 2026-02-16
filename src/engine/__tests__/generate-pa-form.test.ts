import { describe, it, expect } from 'vitest'
import { generatePAForm } from '../generate-pa-form'
import type { PatientSnapshot, AuditResult } from '../../types'

function makeSnapshot(overrides: Partial<PatientSnapshot> = {}): PatientSnapshot {
  return {
    ef: 35,
    nyhaClass: 3,
    sbp: 112,
    hr: 68,
    vitalsDate: '2026-02-14',
    egfr: 45,
    potassium: 4.5,
    labsDate: '2026-02-14',
    bnp: 380,
    medications: [
      { pillar: 'ARNI_ACEi_ARB', name: '', doseTier: 'NOT_PRESCRIBED' },
      { pillar: 'BETA_BLOCKER', name: 'Carvedilol 6.25mg', doseTier: 'LOW' },
      { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
      { pillar: 'SGLT2i', name: 'Dapagliflozin 10mg', doseTier: 'HIGH' },
    ],
    resolutionContext: {
      insurance: {
        payerName: 'BlueCross BlueShield',
        planType: 'commercial',
        memberId: 'BCB-1234',
      },
      prescriber: {
        npi: '1234567890',
        name: 'Dr. Chen',
        specialty: 'Cardiology',
      },
      priorTrials: [
        {
          drugName: 'Sacubitril/Valsartan',
          pillar: 'ARNI_ACEi_ARB',
          startDate: '2025-12-22',
          durationDays: 14,
          outcome: 'tolerated',
        },
      ],
    },
    ...overrides,
  }
}

function makeAuditResult(): AuditResult {
  return {
    efCategory: 'HFrEF',
    pillarResults: [
      { pillar: 'ARNI_ACEi_ARB', status: 'MISSING', doseTier: 'NOT_PRESCRIBED', blockers: ['STEP_THERAPY_REQUIRED'], missingInfo: [] },
      { pillar: 'BETA_BLOCKER', status: 'UNDERDOSED', doseTier: 'LOW', blockers: [], missingInfo: [] },
      { pillar: 'MRA', status: 'MISSING', doseTier: 'NOT_PRESCRIBED', blockers: ['COPAY_PROHIBITIVE'], missingInfo: [] },
      { pillar: 'SGLT2i', status: 'ON_TARGET', doseTier: 'HIGH', blockers: [], missingInfo: [] },
    ],
    gdmtScore: { score: 16, maxPossible: 100, normalized: 16, excludedPillars: [], isIncomplete: false },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-14T00:00:00Z',
  }
}

describe('generatePAForm', () => {
  it('generates PA form with correct diagnosis code for HFrEF', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.diagnosisCode).toBe('I50.22')
    expect(form.diagnosisDescription).toContain('systolic')
  })

  it('generates PA form with correct EF and NYHA', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.efPercent).toBe(35)
    expect(form.nyhaClass).toBe(3)
  })

  it('includes clinical justification with EF value', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.clinicalJustification).toContain('35%')
    expect(form.clinicalJustification).toContain('NYHA Class 3')
  })

  it('includes guideline reference', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.guidelineReference).toContain('AHA')
    expect(form.guidelineClass).toContain('Class I')
  })

  it('includes relevant labs when available', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    const labNames = form.relevantLabs.map((l) => l.name)
    expect(labNames).toContain('eGFR')
    expect(labNames).toContain('Potassium')
    expect(labNames).toContain('BNP')
  })

  it('omits labs when not available', () => {
    const snapshot = makeSnapshot({ egfr: undefined, potassium: undefined, bnp: undefined })
    const form = generatePAForm('ARNI_ACEi_ARB', snapshot, makeAuditResult())
    expect(form.relevantLabs).toHaveLength(0)
  })

  it('includes prior trials for the pillar', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.priorTrials).toHaveLength(1)
    expect(form.priorTrials[0].drugName).toContain('Sacubitril')
  })

  it('excludes prior trials for different pillars', () => {
    const form = generatePAForm('MRA', makeSnapshot(), makeAuditResult())
    expect(form.priorTrials).toHaveLength(0)
  })

  it('includes insurance info from resolution context', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.insurance.payerName).toBe('BlueCross BlueShield')
    expect(form.insurance.memberId).toBe('BCB-1234')
  })

  it('includes prescriber info from resolution context', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.prescriber.name).toBe('Dr. Chen')
    expect(form.prescriber.npi).toBe('1234567890')
  })

  it('uses default drug name when medication name is empty', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.requestedDrug).toContain('Sacubitril/Valsartan')
  })

  it('generates with draft status', () => {
    const form = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form.status).toBe('draft')
  })

  it('handles missing resolution context gracefully', () => {
    const snapshot = makeSnapshot({ resolutionContext: undefined })
    const form = generatePAForm('ARNI_ACEi_ARB', snapshot, makeAuditResult())
    expect(form.priorTrials).toHaveLength(0)
    expect(form.insurance).toEqual({})
    expect(form.prescriber).toEqual({})
  })

  it('generates unique IDs', () => {
    const form1 = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    const form2 = generatePAForm('ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(form1.id).not.toBe(form2.id)
  })

  it('generates correct form for MRA pillar', () => {
    const form = generatePAForm('MRA', makeSnapshot(), makeAuditResult())
    expect(form.requestedDrugPillar).toBe('MRA')
    expect(form.clinicalJustification).toContain('MRA')
    expect(form.clinicalJustification).toContain('RALES')
  })
})
