import { describe, it, expect } from 'vitest'
import { exportProblemList } from '../export-problem-list'
import type { AuditResult } from '../../types/audit'

const mockAudit: AuditResult = {
  efCategory: 'HFrEF',
  pillarResults: [
    {
      pillar: 'ARNI_ACEi_ARB',
      status: 'MISSING',
      doseTier: 'NOT_PRESCRIBED',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: ['Recent lab panel'],
    },
    {
      pillar: 'SGLT2i',
      status: 'ON_TARGET',
      doseTier: 'HIGH',
      blockers: [],
      missingInfo: [],
    },
  ],
  gdmtScore: {
    score: 25,
    maxPossible: 100,
    normalized: 25,
    excludedPillars: [],
    isIncomplete: false,
  },
  missingInfo: ['Recent lab panel'],
  nextBestQuestions: ['Order updated lab panel (eGFR, K+)'],
  timestamp: '2026-02-14T00:00:00.000Z',
}

describe('exportProblemList', () => {
  it('includes DRAFT and SYNTHETIC DATA headers', () => {
    const result = exportProblemList(mockAudit)
    expect(result).toContain('DRAFT')
    expect(result).toContain('SYNTHETIC DATA ONLY')
  })

  it('includes EF category and GDMT score', () => {
    const result = exportProblemList(mockAudit)
    expect(result).toContain('EF Category: HFrEF')
    expect(result).toContain('GDMT Score: 25/100')
  })

  it('lists each pillar with status', () => {
    const result = exportProblemList(mockAudit)
    expect(result).toContain('ARNI/ACEi/ARB: MISSING')
    expect(result).toContain('SGLT2i: ON_TARGET')
  })

  it('lists blockers and missing info for each pillar', () => {
    const result = exportProblemList(mockAudit)
    expect(result).toContain('Blocker: No identified blocker')
    expect(result).toContain('Missing: Recent lab panel')
  })

  it('includes next best questions', () => {
    const result = exportProblemList(mockAudit)
    expect(result).toContain('Order updated lab panel')
  })

  it('includes generator attribution', () => {
    const result = exportProblemList(mockAudit)
    expect(result).toContain('Inertia Linter (Guideline-as-Code v2)')
  })
})
