import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generatePreVisitNote } from '../generate-pre-visit-note'
import type { AuditResult, PillarResult } from '../../types/audit.ts'
import type { ActionItem, ActionDecisionRecord } from '../../types/action-plan.ts'
import type { Medication } from '../../types/patient.ts'
import { PILLARS, PILLAR_STATUSES, DOSE_TIERS } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePillarResult(
  pillar: PillarResult['pillar'],
  status: PillarResult['status'],
  doseTier: PillarResult['doseTier'],
  blockers: ReadonlyArray<string> = [],
): PillarResult {
  return {
    pillar,
    status,
    doseTier,
    blockers: blockers as ReadonlyArray<PillarResult['blockers'][number]>,
    missingInfo: [],
  }
}

function makeAuditResult(
  pillarResults: ReadonlyArray<PillarResult>,
  efCategory: AuditResult['efCategory'] = 'HFrEF',
  score = 24,
  maxPossible = 100,
): AuditResult {
  return {
    efCategory,
    pillarResults,
    gdmtScore: {
      score,
      maxPossible,
      normalized: maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0,
      excludedPillars: [],
      isIncomplete: false,
    },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-15T00:00:00Z',
  }
}

function makeAction(
  pillar: ActionItem['pillar'],
  category: ActionItem['category'],
  id?: string,
): ActionItem {
  return {
    id: id ?? `${pillar}-${category}`,
    pillar,
    category,
    priority: 'high',
    title: `${pillar}: ${category}`,
    rationale: `Rationale for ${category} of ${pillar}`,
    suggestedAction: `Suggested action for ${pillar}`,
    evidence: 'Evidence',
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
    timestamp: '2026-02-15T00:00:00Z',
  }
}

function makeMedication(
  pillar: Medication['pillar'],
  name: string,
  doseTier: Medication['doseTier'],
): Medication {
  return { pillar, name, doseTier }
}

const FIXED_ISO = '2026-02-15T00:00:00.000Z'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generatePreVisitNote', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(FIXED_ISO))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const defaultAudit = makeAuditResult([
    makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
  ])

  it('returns empty note when there are no actions', () => {
    const note = generatePreVisitNote(defaultAudit, [], [], [])

    expect(note.medicationPlans).toHaveLength(0)
    expect(note.patientExplanations).toHaveLength(0)
    expect(note.deferredItems).toHaveLength(0)
    expect(note.nextVisitMonitoring).toHaveLength(0)
    expect(note.generatedAt).toBe(FIXED_ISO)
    expect(note.gdmtScore).toBe(24)
    expect(note.efCategory).toBe('HFrEF')
  })

  it('generates correct INITIATE plan for MISSING pillar with address_now decision', () => {
    const action = makeAction(PILLARS.MRA, 'initiate')
    const decision = makeDecision(action.id, 'address_now')
    const medications: ReadonlyArray<Medication> = []

    const note = generatePreVisitNote(defaultAudit, [action], [decision], medications)

    expect(note.medicationPlans).toHaveLength(1)
    const plan = note.medicationPlans[0]
    expect(plan.pillar).toBe(PILLARS.MRA)
    expect(plan.changeType).toBe('INITIATE')
    expect(plan.currentDose).toBe('NOT_PRESCRIBED')
    expect(plan.targetDose).toBe('LOW')
    expect(plan.drugName).toBe('MRA')
    expect(plan.rationale).toContain('initiate')
    expect(plan.monitoringItems).toContain('Potassium')
    expect(plan.monitoringItems).toContain('Renal function (eGFR)')
  })

  it('generates correct UPTITRATE plan for UNDERDOSED pillar with address_now decision', () => {
    const action = makeAction(PILLARS.BETA_BLOCKER, 'uptitrate')
    const decision = makeDecision(action.id, 'address_now')
    const medications: ReadonlyArray<Medication> = [
      makeMedication(PILLARS.BETA_BLOCKER, 'Carvedilol', 'LOW'),
    ]

    const note = generatePreVisitNote(defaultAudit, [action], [decision], medications)

    expect(note.medicationPlans).toHaveLength(1)
    const plan = note.medicationPlans[0]
    expect(plan.pillar).toBe(PILLARS.BETA_BLOCKER)
    expect(plan.changeType).toBe('UPTITRATE')
    expect(plan.currentDose).toBe('LOW')
    expect(plan.targetDose).toBe('MEDIUM')
    expect(plan.drugName).toBe('Carvedilol')
    expect(plan.rationale).toContain('uptitrate')
  })

  it('records deferred action in deferredItems with reason', () => {
    const action = makeAction(PILLARS.SGLT2i, 'initiate')
    const decision = makeDecision(action.id, 'defer', 'Active UTI — defer until resolved')

    const note = generatePreVisitNote(defaultAudit, [action], [decision], [])

    expect(note.deferredItems).toHaveLength(1)
    expect(note.deferredItems[0].pillar).toBe(PILLARS.SGLT2i)
    expect(note.deferredItems[0].reason).toBe('Active UTI — defer until resolved')
    expect(note.medicationPlans).toHaveLength(0)
    expect(note.patientExplanations).toHaveLength(0)
  })

  it('excludes not_applicable actions from the note entirely', () => {
    const action = makeAction(PILLARS.MRA, 'initiate')
    const decision = makeDecision(action.id, 'not_applicable', 'Not relevant')

    const note = generatePreVisitNote(defaultAudit, [action], [decision], [])

    expect(note.medicationPlans).toHaveLength(0)
    expect(note.patientExplanations).toHaveLength(0)
    expect(note.deferredItems).toHaveLength(0)
    expect(note.nextVisitMonitoring).toHaveLength(0)
  })

  it('excludes actions with no matching decision record', () => {
    const action = makeAction(PILLARS.MRA, 'initiate')
    // No decision record for this action

    const note = generatePreVisitNote(defaultAudit, [action], [], [])

    expect(note.medicationPlans).toHaveLength(0)
    expect(note.patientExplanations).toHaveLength(0)
  })

  it('processes multiple actions correctly', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction(PILLARS.MRA, 'initiate'),
      makeAction(PILLARS.BETA_BLOCKER, 'uptitrate'),
      makeAction(PILLARS.SGLT2i, 'initiate'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision(actions[0].id, 'address_now'),
      makeDecision(actions[1].id, 'address_now'),
      makeDecision(actions[2].id, 'defer', 'Active infection'),
    ]
    const medications: ReadonlyArray<Medication> = [
      makeMedication(PILLARS.BETA_BLOCKER, 'Metoprolol', 'LOW'),
    ]

    const note = generatePreVisitNote(defaultAudit, actions, decisions, medications)

    expect(note.medicationPlans).toHaveLength(2)
    expect(note.patientExplanations).toHaveLength(2)
    expect(note.deferredItems).toHaveLength(1)

    const pillarsPlanned = note.medicationPlans.map((p) => p.pillar)
    expect(pillarsPlanned).toContain(PILLARS.MRA)
    expect(pillarsPlanned).toContain(PILLARS.BETA_BLOCKER)

    expect(note.deferredItems[0].pillar).toBe(PILLARS.SGLT2i)
    expect(note.deferredItems[0].reason).toBe('Active infection')
  })

  it('returns pillar-specific monitoring items for ARNI_ACEi_ARB', () => {
    const action = makeAction(PILLARS.ARNI_ACEi_ARB, 'initiate')
    const decision = makeDecision(action.id, 'address_now')

    const note = generatePreVisitNote(defaultAudit, [action], [decision], [])

    const plan = note.medicationPlans[0]
    expect(plan.monitoringItems).toContain('Blood pressure')
    expect(plan.monitoringItems).toContain('Renal function (eGFR, Cr)')
    expect(plan.monitoringItems).toContain('Potassium')
  })

  it('returns pillar-specific monitoring items for SGLT2i', () => {
    const action = makeAction(PILLARS.SGLT2i, 'initiate')
    const decision = makeDecision(action.id, 'address_now')

    const note = generatePreVisitNote(defaultAudit, [action], [decision], [])

    const plan = note.medicationPlans[0]
    expect(plan.monitoringItems).toContain('Renal function')
    expect(plan.monitoringItems).toContain('Signs of genital/urinary infection')
    expect(plan.monitoringItems).toContain('Volume status')
  })

  it('returns correct side effects for each pillar class', () => {
    const action = makeAction(PILLARS.BETA_BLOCKER, 'uptitrate')
    const decision = makeDecision(action.id, 'address_now')
    const medications: ReadonlyArray<Medication> = [
      makeMedication(PILLARS.BETA_BLOCKER, 'Carvedilol', 'LOW'),
    ]

    const note = generatePreVisitNote(defaultAudit, [action], [decision], medications)

    const explanation = note.patientExplanations[0]
    expect(explanation.sideEffectsToWatch).toContain('Fatigue')
    expect(explanation.sideEffectsToWatch).toContain('Slow heart rate')
    expect(explanation.sideEffectsToWatch).toContain('Cold hands/feet')
  })

  it('generates INITIATE explanation text for new medications', () => {
    const action = makeAction(PILLARS.SGLT2i, 'initiate')
    const decision = makeDecision(action.id, 'address_now')

    const note = generatePreVisitNote(defaultAudit, [action], [decision], [])

    const explanation = note.patientExplanations[0]
    expect(explanation.explanation).toContain('Starting')
    expect(explanation.explanation).toContain('SGLT2i')
  })

  it('generates UPTITRATE explanation text for dose increases', () => {
    const action = makeAction(PILLARS.ARNI_ACEi_ARB, 'uptitrate')
    const decision = makeDecision(action.id, 'address_now')
    const medications: ReadonlyArray<Medication> = [
      makeMedication(PILLARS.ARNI_ACEi_ARB, 'Sacubitril/Valsartan', 'MEDIUM'),
    ]

    const note = generatePreVisitNote(defaultAudit, [action], [decision], medications)

    const explanation = note.patientExplanations[0]
    expect(explanation.explanation).toContain('Increasing')
    expect(explanation.explanation).toContain('Sacubitril/Valsartan')
    expect(explanation.explanation).toContain('target dose')
  })

  it('deduplicates nextVisitMonitoring across multiple pillars', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction(PILLARS.ARNI_ACEi_ARB, 'initiate'),
      makeAction(PILLARS.MRA, 'initiate'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision(actions[0].id, 'address_now'),
      makeDecision(actions[1].id, 'address_now'),
    ]

    const note = generatePreVisitNote(defaultAudit, actions, decisions, [])

    // "Potassium" appears in both ARNI_ACEi_ARB and MRA monitoring
    const potassiumCount = note.nextVisitMonitoring.filter(
      (item) => item === 'Potassium',
    ).length
    expect(potassiumCount).toBe(1)

    // All unique items from both pillars should be present
    expect(note.nextVisitMonitoring).toContain('Blood pressure')
    expect(note.nextVisitMonitoring).toContain('Renal function (eGFR, Cr)')
    expect(note.nextVisitMonitoring).toContain('Potassium')
    expect(note.nextVisitMonitoring).toContain('Renal function (eGFR)')
    expect(note.nextVisitMonitoring).toContain('Signs of gynecomastia (if spironolactone)')
  })

  it('uses PILLAR_LABELS as fallback drug name when no medication exists', () => {
    const action = makeAction(PILLARS.MRA, 'initiate')
    const decision = makeDecision(action.id, 'address_now')

    const note = generatePreVisitNote(defaultAudit, [action], [decision], [])

    expect(note.medicationPlans[0].drugName).toBe('MRA')
    expect(note.patientExplanations[0].drugName).toBe('MRA')
  })

  it('uses medication name when medication exists for the pillar', () => {
    const action = makeAction(PILLARS.MRA, 'initiate')
    const decision = makeDecision(action.id, 'address_now')
    const medications: ReadonlyArray<Medication> = [
      makeMedication(PILLARS.MRA, 'Spironolactone', 'NOT_PRESCRIBED'),
    ]

    const note = generatePreVisitNote(defaultAudit, [action], [decision], medications)

    expect(note.medicationPlans[0].drugName).toBe('Spironolactone')
    expect(note.patientExplanations[0].drugName).toBe('Spironolactone')
  })

  it('sets correct target dose escalation: NOT_PRESCRIBED→LOW, LOW→MEDIUM, MEDIUM→HIGH', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction(PILLARS.ARNI_ACEi_ARB, 'initiate', 'ARNI-init'),
      makeAction(PILLARS.BETA_BLOCKER, 'uptitrate', 'BB-up-low'),
      makeAction(PILLARS.MRA, 'uptitrate', 'MRA-up-med'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision('ARNI-init', 'address_now'),
      makeDecision('BB-up-low', 'address_now'),
      makeDecision('MRA-up-med', 'address_now'),
    ]
    const medications: ReadonlyArray<Medication> = [
      makeMedication(PILLARS.BETA_BLOCKER, 'Carvedilol', 'LOW'),
      makeMedication(PILLARS.MRA, 'Spironolactone', 'MEDIUM'),
    ]

    const note = generatePreVisitNote(defaultAudit, actions, decisions, medications)

    const arniPlan = note.medicationPlans.find((p) => p.pillar === PILLARS.ARNI_ACEi_ARB)
    const bbPlan = note.medicationPlans.find((p) => p.pillar === PILLARS.BETA_BLOCKER)
    const mraPlan = note.medicationPlans.find((p) => p.pillar === PILLARS.MRA)

    expect(arniPlan?.currentDose).toBe('NOT_PRESCRIBED')
    expect(arniPlan?.targetDose).toBe('LOW')

    expect(bbPlan?.currentDose).toBe('LOW')
    expect(bbPlan?.targetDose).toBe('MEDIUM')

    expect(mraPlan?.currentDose).toBe('MEDIUM')
    expect(mraPlan?.targetDose).toBe('HIGH')
  })

  it('sets whenToCallDoctor on all patient explanations', () => {
    const actions: ReadonlyArray<ActionItem> = [
      makeAction(PILLARS.ARNI_ACEi_ARB, 'initiate'),
      makeAction(PILLARS.SGLT2i, 'initiate'),
    ]
    const decisions: ReadonlyArray<ActionDecisionRecord> = [
      makeDecision(actions[0].id, 'address_now'),
      makeDecision(actions[1].id, 'address_now'),
    ]

    const note = generatePreVisitNote(defaultAudit, actions, decisions, [])

    for (const explanation of note.patientExplanations) {
      expect(explanation.whenToCallDoctor).toContain('severe dizziness')
      expect(explanation.whenToCallDoctor).toContain('swelling')
      expect(explanation.whenToCallDoctor).toContain('difficulty breathing')
    }
  })

  it('provides default reason for deferred items when no reason is given', () => {
    const action = makeAction(PILLARS.MRA, 'initiate')
    const decision = makeDecision(action.id, 'defer')

    const note = generatePreVisitNote(defaultAudit, [action], [decision], [])

    expect(note.deferredItems[0].reason).toBe('No reason provided')
  })

  it('returns a new object (immutability)', () => {
    const note1 = generatePreVisitNote(defaultAudit, [], [], [])
    const note2 = generatePreVisitNote(defaultAudit, [], [], [])

    expect(note1).not.toBe(note2)
    expect(note1).toEqual(note2)
  })
})
