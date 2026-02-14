import { describe, it, expect } from 'vitest'
import { prepareLLMContext } from '../prepare-llm-context'
import type { AuditResult } from '../../types/audit'

function createMockAuditResult(overrides?: Partial<AuditResult>): AuditResult {
  return {
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
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-14T00:00:00.000Z',
    ...overrides,
  }
}

describe('prepareLLMContext', () => {
  it('returns efCategory from audit result', () => {
    const audit = createMockAuditResult({ efCategory: 'HFpEF' })
    const ctx = prepareLLMContext(audit)
    expect(ctx.efCategory).toBe('HFpEF')
  })

  it('maps pillar statuses with pillar, status, and blockers', () => {
    const audit = createMockAuditResult()
    const ctx = prepareLLMContext(audit)

    expect(ctx.pillarStatuses).toHaveLength(2)
    expect(ctx.pillarStatuses[0]).toEqual({
      pillar: 'ARNI_ACEi_ARB',
      status: 'MISSING',
      blockers: ['CLINICAL_INERTIA'],
    })
    expect(ctx.pillarStatuses[1]).toEqual({
      pillar: 'SGLT2i',
      status: 'ON_TARGET',
      blockers: [],
    })
  })

  it('does NOT include any patient numerical values or score data', () => {
    const audit = createMockAuditResult()
    const ctx = prepareLLMContext(audit)

    expect(ctx).not.toHaveProperty('gdmtScore')
    expect(ctx).not.toHaveProperty('missingInfo')
    expect(ctx).not.toHaveProperty('nextBestQuestions')
    expect(ctx).not.toHaveProperty('timestamp')

    const serialized = JSON.stringify(ctx)
    expect(serialized).not.toContain('"sbp"')
    expect(serialized).not.toContain('"egfr"')
    expect(serialized).not.toContain('"potassium"')
    expect(serialized).not.toContain('"doseTier"')
    expect(serialized).not.toContain('"score"')
    expect(serialized).not.toContain('"normalized"')
  })

  it('returns guidelineIds array', () => {
    const audit = createMockAuditResult()
    const ctx = prepareLLMContext(audit)
    expect(Array.isArray(ctx.guidelineIds)).toBe(true)
  })
})
