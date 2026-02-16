import { describe, it, expect } from 'vitest'
import { selectResolutionPathways, hasResolvableBlockers } from '../resolve-pathway'
import type { AuditResult, PatientSnapshot } from '../../types'

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
    medications: [],
    ...overrides,
  }
}

function makeAuditResult(): AuditResult {
  return {
    efCategory: 'HFrEF',
    pillarResults: [],
    gdmtScore: { score: 16, maxPossible: 100, normalized: 16, excludedPillars: [], isIncomplete: false },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-14T00:00:00Z',
  }
}

describe('selectResolutionPathways', () => {
  it('returns empty array for non-resolvable blockers (BP_LOW)', () => {
    const result = selectResolutionPathways('BP_LOW', 'ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(result).toHaveLength(0)
  })

  it('returns empty array for non-resolvable blockers (HR_LOW)', () => {
    const result = selectResolutionPathways('HR_LOW', 'BETA_BLOCKER', makeSnapshot(), makeAuditResult())
    expect(result).toHaveLength(0)
  })

  it('returns pathways for PA_DENIED', () => {
    const result = selectResolutionPathways('PA_DENIED', 'ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result.some((p) => p.type === 'pa_appeal')).toBe(true)
    expect(result.some((p) => p.type === 'generic_switch')).toBe(true)
  })

  it('returns step therapy pathways with bridge', () => {
    const result = selectResolutionPathways('STEP_THERAPY_REQUIRED', 'ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.some((p) => p.type === 'step_therapy_start')).toBe(true)
  })

  it('returns step therapy exception when prior trial exists', () => {
    const snapshot = makeSnapshot({
      resolutionContext: {
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
    })
    const result = selectResolutionPathways('STEP_THERAPY_REQUIRED', 'ARNI_ACEi_ARB', snapshot, makeAuditResult())
    expect(result.some((p) => p.type === 'step_therapy_exception')).toBe(true)
  })

  it('returns copay pathways with generic switch as primary', () => {
    const result = selectResolutionPathways('COPAY_PROHIBITIVE', 'MRA', makeSnapshot(), makeAuditResult())
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0].type).toBe('generic_switch')
    expect(result[0].urgency).toBe('immediate')
  })

  it('returns formulary exception pathways', () => {
    const result = selectResolutionPathways('FORMULARY_EXCLUDED', 'SGLT2i', makeSnapshot(), makeAuditResult())
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result.some((p) => p.type === 'formulary_exception')).toBe(true)
    expect(result.some((p) => p.type === 'therapeutic_alternative')).toBe(true)
  })

  it('returns PA pending tracking pathway', () => {
    const result = selectResolutionPathways('PA_PENDING', 'ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.some((p) => p.type === 'pa_resubmit')).toBe(true)
  })

  it('returns discharge reconciliation pathway', () => {
    const result = selectResolutionPathways('DISCHARGE_MED_LOST', 'MRA', makeSnapshot(), makeAuditResult())
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('discharge_reconciliation')
    expect(result[0].urgency).toBe('immediate')
  })

  it('returns handoff followup pathway', () => {
    const result = selectResolutionPathways('HANDOFF_GAP', 'BETA_BLOCKER', makeSnapshot(), makeAuditResult())
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('handoff_followup')
  })

  it('returns periop restart pathway', () => {
    const result = selectResolutionPathways('PERIOP_HOLD', 'ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('periop_restart')
  })

  it('returns cost barrier pathways', () => {
    const result = selectResolutionPathways('COST_BARRIER', 'MRA', makeSnapshot(), makeAuditResult())
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0].type).toBe('generic_switch')
  })

  it('all pathways have required fields', () => {
    const result = selectResolutionPathways('PA_DENIED', 'ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    for (const pathway of result) {
      expect(pathway.id).toBeTruthy()
      expect(pathway.title).toBeTruthy()
      expect(pathway.description).toBeTruthy()
      expect(pathway.steps.length).toBeGreaterThan(0)
      expect(pathway.estimatedTime).toBeTruthy()
    }
  })

  it('steps have sequential ordering', () => {
    const result = selectResolutionPathways('STEP_THERAPY_REQUIRED', 'ARNI_ACEi_ARB', makeSnapshot(), makeAuditResult())
    for (const pathway of result) {
      for (let i = 0; i < pathway.steps.length; i++) {
        expect(pathway.steps[i].order).toBe(i + 1)
      }
    }
  })
})

describe('hasResolvableBlockers', () => {
  it('returns true for ACCESS blockers', () => {
    expect(hasResolvableBlockers(['PA_DENIED'])).toBe(true)
    expect(hasResolvableBlockers(['STEP_THERAPY_REQUIRED'])).toBe(true)
    expect(hasResolvableBlockers(['FORMULARY_EXCLUDED'])).toBe(true)
  })

  it('returns true for TRANSITION blockers', () => {
    expect(hasResolvableBlockers(['DISCHARGE_MED_LOST'])).toBe(true)
    expect(hasResolvableBlockers(['HANDOFF_GAP'])).toBe(true)
  })

  it('returns true for PATIENT cost blockers', () => {
    expect(hasResolvableBlockers(['COPAY_PROHIBITIVE'])).toBe(true)
    expect(hasResolvableBlockers(['COST_BARRIER'])).toBe(true)
  })

  it('returns false for non-resolvable blockers', () => {
    expect(hasResolvableBlockers(['BP_LOW'])).toBe(false)
    expect(hasResolvableBlockers(['HR_LOW'])).toBe(false)
    expect(hasResolvableBlockers(['K_HIGH'])).toBe(false)
    expect(hasResolvableBlockers(['CLINICAL_INERTIA'])).toBe(false)
  })

  it('returns true if any blocker is resolvable', () => {
    expect(hasResolvableBlockers(['BP_LOW', 'PA_DENIED'])).toBe(true)
  })

  it('returns false for empty array', () => {
    expect(hasResolvableBlockers([])).toBe(false)
  })
})
