import { describe, it, expect } from 'vitest'
import { generateAppealLetter } from '../generate-appeal-letter'
import type { PAFormData } from '../../types/resolution'

function makePAForm(overrides: Partial<PAFormData> = {}): PAFormData {
  return {
    id: 'pa-ARNI_ACEi_ARB-123',
    generatedAt: '2026-02-14T00:00:00Z',
    status: 'draft',
    requestedDrug: 'Sacubitril/Valsartan (Entresto)',
    requestedDrugPillar: 'ARNI_ACEi_ARB',
    requestedDoseTier: 'LOW',
    diagnosisCode: 'I50.22',
    diagnosisDescription: 'Chronic systolic (congestive) heart failure',
    efPercent: 35,
    nyhaClass: 3,
    clinicalJustification: 'Patient has HFrEF with EF 35%, NYHA Class 3. ARNI is Class I, LOE B-R.',
    guidelineReference: 'AHA/ACC/HFSA 2022 Guideline',
    guidelineClass: 'Class I, Level of Evidence B-R',
    priorTrials: [
      {
        drugName: 'Sacubitril/Valsartan 24/26mg',
        pillar: 'ARNI_ACEi_ARB',
        startDate: '2025-12-22',
        endDate: '2026-01-05',
        durationDays: 14,
        outcome: 'tolerated',
        reasonStopped: 'PA denied at discharge',
      },
    ],
    relevantLabs: [
      { name: 'eGFR', value: 45, unit: 'mL/min/1.73m2', date: '2026-02-14' },
      { name: 'Potassium', value: 4.5, unit: 'mEq/L', date: '2026-02-14' },
      { name: 'BNP', value: 380, unit: 'pg/mL', date: '2026-02-14' },
    ],
    insurance: {
      payerName: 'BlueCross BlueShield',
      memberId: 'BCB-1234',
      groupNumber: 'GRP-882',
    },
    prescriber: {
      npi: '1234567890',
      name: 'Dr. James Chen',
      specialty: 'Cardiology',
      phone: '312-555-0142',
      fax: '312-555-0143',
    },
    ...overrides,
  }
}

describe('generateAppealLetter', () => {
  it('generates appeal letter with type and title', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.type).toBe('appeal_letter')
    expect(doc.title).toContain('PA Appeal')
    expect(doc.title).toContain('Entresto')
  })

  it('includes payer information', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('BlueCross BlueShield')
    expect(doc.content).toContain('BCB-1234')
    expect(doc.content).toContain('GRP-882')
  })

  it('includes diagnosis code and description', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('I50.22')
    expect(doc.content).toContain('systolic')
  })

  it('includes clinical justification', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('CLINICAL JUSTIFICATION')
    expect(doc.content).toContain('HFrEF')
  })

  it('includes guideline support section', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('GUIDELINE SUPPORT')
    expect(doc.content).toContain('AHA')
  })

  it('includes patient clinical data', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('Ejection Fraction: 35%')
    expect(doc.content).toContain('NYHA Functional Class: 3')
  })

  it('includes relevant lab values', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('eGFR: 45')
    expect(doc.content).toContain('Potassium: 4.5')
    expect(doc.content).toContain('BNP: 380')
  })

  it('includes prior drug trials', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('PRIOR DRUG TRIALS')
    expect(doc.content).toContain('Sacubitril/Valsartan')
    expect(doc.content).toContain('14 days')
    expect(doc.content).toContain('tolerated')
  })

  it('includes denial reason when provided', () => {
    const doc = generateAppealLetter(makePAForm(), 'Step therapy requirement not met')
    expect(doc.content).toContain('Denial Reason: Step therapy requirement not met')
  })

  it('omits denial reason section when not provided', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).not.toContain('Denial Reason:')
  })

  it('includes prescriber signature block', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.content).toContain('Dr. James Chen')
    expect(doc.content).toContain('Cardiology')
    expect(doc.content).toContain('NPI: 1234567890')
  })

  it('marks as requiring review', () => {
    const doc = generateAppealLetter(makePAForm())
    expect(doc.requiresReview).toBe(true)
    expect(doc.isApproved).toBe(false)
  })

  it('handles empty insurance gracefully', () => {
    const doc = generateAppealLetter(makePAForm({ insurance: {} }))
    expect(doc.content).toContain('APPEAL FOR PRIOR AUTHORIZATION')
    expect(doc.content).not.toContain('To: undefined')
  })

  it('handles empty prescriber gracefully', () => {
    const doc = generateAppealLetter(makePAForm({ prescriber: {} }))
    expect(doc.content).toContain('APPEAL FOR PRIOR AUTHORIZATION')
    expect(doc.content).not.toContain('Sincerely')
  })

  it('handles empty prior trials', () => {
    const doc = generateAppealLetter(makePAForm({ priorTrials: [] }))
    expect(doc.content).not.toContain('PRIOR DRUG TRIALS')
  })
})
