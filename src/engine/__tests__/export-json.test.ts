import { describe, it, expect } from 'vitest'
import { exportJSON } from '../export-json'
import type { AuditResult } from '../../types/audit'

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
  ],
  gdmtScore: {
    score: 0,
    maxPossible: 100,
    normalized: 0,
    excludedPillars: [],
    isIncomplete: false,
  },
  missingInfo: [],
  nextBestQuestions: [],
  timestamp: '2026-02-14T00:00:00.000Z',
}

describe('exportJSON', () => {
  it('returns valid JSON', () => {
    const result = exportJSON(mockAudit)
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('includes _meta with generator and disclaimer', () => {
    const result = exportJSON(mockAudit)
    const parsed = JSON.parse(result)
    expect(parsed._meta.generator).toContain('Inertia Linter')
    expect(parsed._meta.disclaimer).toContain('DRAFT')
    expect(parsed._meta.disclaimer).toContain('SYNTHETIC DATA ONLY')
  })

  it('includes efCategory', () => {
    const result = exportJSON(mockAudit)
    const parsed = JSON.parse(result)
    expect(parsed.efCategory).toBe('HFrEF')
  })

  it('includes gdmtScore', () => {
    const result = exportJSON(mockAudit)
    const parsed = JSON.parse(result)
    expect(parsed.gdmtScore.normalized).toBe(0)
  })

  it('includes pillarResults', () => {
    const result = exportJSON(mockAudit)
    const parsed = JSON.parse(result)
    expect(parsed.pillarResults).toHaveLength(1)
    expect(parsed.pillarResults[0].pillar).toBe('ARNI_ACEi_ARB')
  })

  it('is pretty-printed with 2 space indentation', () => {
    const result = exportJSON(mockAudit)
    expect(result).toContain('  "efCategory"')
  })

  it('includes timestamp in _meta', () => {
    const result = exportJSON(mockAudit)
    const parsed = JSON.parse(result)
    expect(parsed._meta.timestamp).toBe('2026-02-14T00:00:00.000Z')
  })
})
