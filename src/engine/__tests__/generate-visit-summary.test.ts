import { describe, it, expect, vi } from 'vitest'
import { generateVisitSummary } from '../generate-visit-summary'
import type { AuditResult } from '../../types/audit'
import type { ActionItem, ActionDecisionRecord } from '../../types/action-plan'

const mockAudit: AuditResult = {
  efCategory: 'HFrEF',
  pillarResults: [
    {
      pillar: 'ARNI_ACEi_ARB',
      status: 'UNDERDOSED',
      doseTier: 'LOW',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
    {
      pillar: 'BETA_BLOCKER',
      status: 'UNDERDOSED',
      doseTier: 'MEDIUM',
      blockers: ['CLINICAL_INERTIA'],
      missingInfo: [],
    },
    {
      pillar: 'MRA',
      status: 'MISSING',
      doseTier: 'NOT_PRESCRIBED',
      blockers: ['CLINICAL_INERTIA'],
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
    score: 24,
    maxPossible: 100,
    normalized: 24,
    excludedPillars: [],
    isIncomplete: false,
  },
  missingInfo: [],
  nextBestQuestions: [],
  timestamp: '2026-02-15T00:00:00Z',
}

function makeAction(
  id: string,
  title: string,
  suggestedAction: string,
): ActionItem {
  return {
    id,
    pillar: 'ARNI_ACEi_ARB',
    category: 'initiate',
    priority: 'high',
    title,
    rationale: 'Test rationale',
    suggestedAction,
    evidence: '',
    cautions: [],
  }
}

function makeDecision(
  actionId: string,
  decision: ActionDecisionRecord['decision'],
  reason?: string,
): ActionDecisionRecord {
  return {
    actionId,
    decision,
    reason,
    timestamp: '2026-02-15T12:00:00Z',
  }
}

describe('generateVisitSummary', () => {
  it('groups all actions as "Actions Planned" when all decided as address_now', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction('a1', 'MRA: Consider initiating', 'Consider initiating MRA'),
      makeAction('a2', 'ARNI/ACEi/ARB: Uptitration opportunity', 'Consider uptitration if tolerated'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision('a1', 'address_now'),
      makeDecision('a2', 'address_now'),
    ]

    const result = generateVisitSummary(mockAudit, actions, decisions)

    expect(result).toContain('Actions Planned:')
    expect(result).toContain('MRA: Consider initiating')
    expect(result).toContain('ARNI/ACEi/ARB: Uptitration opportunity')
    expect(result).toContain('Deferred:\n(none)')
    expect(result).toContain('Not Applicable:\n(none)')
    expect(result).toContain('Pending Review:\n(none)')
  })

  it('groups actions by decision type with mixed decisions', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction('a1', 'MRA: Consider initiating', 'Consider initiating MRA'),
      makeAction('a2', 'ARNI/ACEi/ARB: Uptitration', 'Consider uptitration'),
      makeAction('a3', 'SGLT2i: Prior ADR', 'Review ADR history'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision('a1', 'address_now'),
      makeDecision('a2', 'defer', 'Patient prefers to wait'),
      makeDecision('a3', 'not_applicable', 'Active UTI'),
    ]

    const result = generateVisitSummary(mockAudit, actions, decisions)

    expect(result).toContain('Actions Planned:')
    expect(result).toContain('MRA: Consider initiating')

    expect(result).toContain('Deferred:')
    expect(result).toContain('ARNI/ACEi/ARB: Uptitration')
    expect(result).toContain('Patient prefers to wait')

    expect(result).toContain('Not Applicable:')
    expect(result).toContain('SGLT2i: Prior ADR')
    expect(result).toContain('Active UTI')
  })

  it('groups all actions as "Pending Review" when all undecided', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction('a1', 'MRA: Consider initiating', 'Consider initiating MRA'),
      makeAction('a2', 'Beta-blocker: Uptitration', 'Consider uptitration'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision('a1', 'undecided'),
      makeDecision('a2', 'undecided'),
    ]

    const result = generateVisitSummary(mockAudit, actions, decisions)

    expect(result).toContain('Pending Review:')
    expect(result).toContain('- MRA: Consider initiating')
    expect(result).toContain('- Beta-blocker: Uptitration')
    expect(result).toContain('Actions Planned:\n(none)')
  })

  it('treats actions without decisions as pending', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction('a1', 'MRA: Consider initiating', 'Consider initiating MRA'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = []

    const result = generateVisitSummary(mockAudit, actions, decisions)

    expect(result).toContain('Pending Review:')
    expect(result).toContain('- MRA: Consider initiating')
  })

  it('shows (none) for all sections when actions array is empty', () => {
    const result = generateVisitSummary(mockAudit, [], [])

    expect(result).toContain('Actions Planned:\n(none)')
    expect(result).toContain('Deferred:\n(none)')
    expect(result).toContain('Not Applicable:\n(none)')
    expect(result).toContain('Pending Review:\n(none)')
  })

  it('includes DRAFT watermark in output', () => {
    const result = generateVisitSummary(mockAudit, [], [])

    expect(result).toContain('DRAFT')
    expect(result).toContain('[DRAFT')
    expect(result).toContain('Not a clinical document')
  })

  it('includes date in YYYY-MM-DD format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T10:00:00Z'))

    const result = generateVisitSummary(mockAudit, [], [])

    expect(result).toContain('Date: 2026-02-15')

    vi.useRealTimers()
  })

  it('includes GDMT score display', () => {
    const result = generateVisitSummary(mockAudit, [], [])

    expect(result).toContain('GDMT Score: 24/100')
  })

  it('includes EF category', () => {
    const result = generateVisitSummary(mockAudit, [], [])

    expect(result).toContain('EF Category: HFrEF')
  })

  it('shows "No reason provided" when deferred action has no reason', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction('a1', 'MRA: Consider initiating', 'Consider initiating MRA'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision('a1', 'defer'),
    ]

    const result = generateVisitSummary(mockAudit, actions, decisions)

    expect(result).toContain('No reason provided')
  })

  it('includes suggested action text for planned actions', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction('a1', 'MRA: Consider initiating', 'Consider initiating MRA therapy'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision('a1', 'address_now'),
    ]

    const result = generateVisitSummary(mockAudit, actions, decisions)

    expect(result).toContain('Consider initiating MRA therapy')
  })

  it('displays the header line correctly', () => {
    const result = generateVisitSummary(mockAudit, [], [])

    expect(result).toContain('GDMT Optimization Visit Summary (DRAFT)')
  })
})
