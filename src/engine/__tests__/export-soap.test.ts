import { describe, it, expect } from 'vitest'
import { exportSOAP } from '../export-soap'
import type { AuditResult } from '../../types/audit'
import type { PatientSnapshot } from '../../types/patient'

const mockAudit: AuditResult = {
  efCategory: 'HFrEF',
  pillarResults: [
    {
      pillar: 'ARNI_ACEi_ARB',
      status: 'MISSING',
      doseTier: 'NOT_PRESCRIBED',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
    {
      pillar: 'BETA_BLOCKER',
      status: 'UNDERDOSED',
      doseTier: 'LOW',
      blockers: [],
      missingInfo: [],
    },
    {
      pillar: 'MRA',
      status: 'ON_TARGET',
      doseTier: 'HIGH',
      blockers: [],
      missingInfo: [],
    },
    {
      pillar: 'SGLT2i',
      status: 'MISSING',
      doseTier: 'NOT_PRESCRIBED',
      blockers: ['ADR_HISTORY'],
      missingInfo: [],
    },
  ],
  gdmtScore: {
    score: 33,
    maxPossible: 100,
    normalized: 33,
    excludedPillars: [],
    isIncomplete: false,
  },
  missingInfo: ['Recent eGFR value'],
  nextBestQuestions: ['Order updated lab panel (eGFR, K+)'],
  timestamp: '2026-02-14T00:00:00.000Z',
}

const mockPatient: PatientSnapshot = {
  ef: 30,
  nyhaClass: 3,
  sbp: 110,
  hr: 72,
  vitalsDate: '2026-02-01',
  egfr: 45,
  potassium: 4.2,
  labsDate: '2026-02-01',
  medications: [],
}

describe('exportSOAP', () => {
  it('includes DRAFT and SYNTHETIC DATA headers', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('DRAFT')
    expect(result).toContain('SYNTHETIC DATA ONLY')
  })

  it('includes S, O, A, P sections', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('S (Subjective)')
    expect(result).toContain('O (Objective)')
    expect(result).toContain('A (Assessment)')
    expect(result).toContain('P (Plan)')
  })

  it('includes NYHA class in Subjective', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('NYHA Class 3')
  })

  it('includes vitals in Objective', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('EF 30%')
    expect(result).toContain('SBP 110')
    expect(result).toContain('HR 72')
    expect(result).toContain('eGFR 45')
    expect(result).toContain('K+ 4.2')
  })

  it('includes EF category and GDMT score in Assessment', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('EF Category: HFrEF')
    expect(result).toContain('GDMT Score: 33/100')
  })

  it('includes pillar statuses with blocker labels', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('ARNI/ACEi/ARB: MISSING')
    expect(result).toContain('No identified blocker')
    expect(result).toContain('Beta-blocker: UNDERDOSED')
    expect(result).toContain('SGLT2i: MISSING')
    expect(result).toContain('Prior adverse drug reaction')
  })

  it('includes missing info and next best questions in Plan', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('Recent eGFR value')
    expect(result).toContain('Order updated lab panel')
  })

  it('includes generator attribution', () => {
    const result = exportSOAP(mockAudit, mockPatient)
    expect(result).toContain('Inertia Linter (Guideline-as-Code v2)')
  })

  it('handles missing optional fields gracefully', () => {
    const patientNoLabs: PatientSnapshot = {
      ef: 30,
      nyhaClass: 2,
      sbp: 120,
      hr: 68,
      vitalsDate: '2026-02-01',
      medications: [],
    }
    const auditNoMissing: AuditResult = {
      ...mockAudit,
      missingInfo: [],
      nextBestQuestions: [],
    }
    const result = exportSOAP(auditNoMissing, patientNoLabs)
    expect(result).toContain('O (Objective): EF 30%, SBP 120, HR 68')
    expect(result).not.toContain('eGFR')
    expect(result).not.toContain('K+')
  })
})
