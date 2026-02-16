import { describe, it, expect } from 'vitest'
import { detectTransitionGaps } from '../detect-transition-gaps.ts'
import type { PatientTimeline, TimelineEntry, ClinicalEvent } from '../../types/timeline.ts'
import type { PatientSnapshot } from '../../types/patient.ts'
import type { AuditResult } from '../../types/audit.ts'
import type { Medication } from '../../types/patient.ts'
import { PILLARS } from '../../types/pillar.ts'
import { DOSE_TIERS } from '../../types/dose-tier.ts'

function makeMedication(
  pillar: Medication['pillar'],
  name: string,
  doseTier: Medication['doseTier'],
): Medication {
  return { pillar, name, doseTier }
}

function makeSnapshot(overrides: Partial<PatientSnapshot> = {}): PatientSnapshot {
  return {
    ef: 30,
    nyhaClass: 2,
    sbp: 120,
    hr: 72,
    vitalsDate: '2025-01-01',
    egfr: 60,
    potassium: 4.2,
    labsDate: '2025-01-01',
    medications: [],
    ...overrides,
  }
}

function makeAuditResult(): AuditResult {
  return {
    efCategory: 'HFrEF',
    pillarResults: [],
    gdmtScore: {
      score: 0,
      maxPossible: 100,
      normalized: 0,
      excludedPillars: [],
      isIncomplete: false,
    },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2025-01-01T00:00:00Z',
  }
}

function makeEntry(
  date: string,
  medications: ReadonlyArray<Medication>,
  events: ReadonlyArray<ClinicalEvent> = [],
): TimelineEntry {
  return {
    date,
    snapshot: makeSnapshot({ medications }),
    auditResult: makeAuditResult(),
    events,
  }
}

function makeTimeline(entries: ReadonlyArray<TimelineEntry>): PatientTimeline {
  return {
    patientId: 'test-patient-001',
    label: 'Test Patient',
    entries,
  }
}

describe('detectTransitionGaps', () => {
  it('returns empty array for empty timeline', () => {
    const timeline = makeTimeline([])
    const result = detectTransitionGaps(timeline)
    expect(result).toEqual([])
  })

  it('returns empty array for single entry', () => {
    const timeline = makeTimeline([
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toEqual([])
  })

  it('returns empty array when medication is present in all entries (no gaps)', () => {
    const timeline = makeTimeline([
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-01-15', type: 'hospitalization', description: 'Admission for HF' },
      ]),
      makeEntry('2025-03-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-03-15', type: 'visit', description: 'Follow-up visit' },
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toEqual([])
  })

  it('detects single gap when ARNI present in hospitalization but absent in outpatient visit', () => {
    const timeline = makeTimeline([
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-01-15', type: 'hospitalization', description: 'Admission for HF' },
      ]),
      makeEntry('2025-03-15', [
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-03-15', type: 'visit', description: 'Outpatient follow-up' },
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toHaveLength(1)
    expect(result[0].pillar).toBe(PILLARS.ARNI_ACEi_ARB)
    expect(result[0].lastPresentDate).toBe('2025-01-15')
    expect(result[0].lostAtDate).toBe('2025-03-15')
    expect(result[0].fromEntry).toBe('Admission for HF')
    expect(result[0].toEntry).toBe('Outpatient follow-up')
  })

  it('detects multiple gaps when ARNI and MRA both lost after discharge', () => {
    const timeline = makeTimeline([
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
        makeMedication(PILLARS.MRA, 'spironolactone', DOSE_TIERS.LOW),
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-01-15', type: 'discharge', description: 'Discharge from cardiology' },
      ]),
      makeEntry('2025-03-15', [
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-03-15', type: 'visit', description: 'PCP follow-up' },
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toHaveLength(2)
    const gapPillars = result.map((g) => g.pillar)
    expect(gapPillars).toContain(PILLARS.ARNI_ACEi_ARB)
    expect(gapPillars).toContain(PILLARS.MRA)
    for (const gap of result) {
      expect(gap.lastPresentDate).toBe('2025-01-15')
      expect(gap.lostAtDate).toBe('2025-03-15')
      expect(gap.fromEntry).toBe('Discharge from cardiology')
      expect(gap.toEntry).toBe('PCP follow-up')
    }
  })

  it('does not flag a newly added medication as a gap', () => {
    const timeline = makeTimeline([
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-01-15', type: 'visit', description: 'Initial visit' },
      ]),
      makeEntry('2025-03-15', [
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
        makeMedication(PILLARS.SGLT2i, 'dapagliflozin', DOSE_TIERS.HIGH),
      ], [
        { date: '2025-03-15', type: 'visit', description: 'Follow-up — added SGLT2i' },
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toEqual([])
  })

  it('does not flag dose change as a gap when medication is still prescribed', () => {
    const timeline = makeTimeline([
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.HIGH),
      ], [
        { date: '2025-01-15', type: 'visit', description: 'Visit 1' },
      ]),
      makeEntry('2025-03-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
      ], [
        { date: '2025-03-15', type: 'visit', description: 'Visit 2 — dose reduced' },
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toEqual([])
  })

  it('sorts entries by date before comparing', () => {
    // Provide entries in reverse chronological order — function should still detect the gap correctly
    const timeline = makeTimeline([
      makeEntry('2025-03-15', [
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-03-15', type: 'visit', description: 'Later visit' },
      ]),
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
        makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      ], [
        { date: '2025-01-15', type: 'hospitalization', description: 'Earlier hospitalization' },
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toHaveLength(1)
    expect(result[0].pillar).toBe(PILLARS.ARNI_ACEi_ARB)
    expect(result[0].lastPresentDate).toBe('2025-01-15')
    expect(result[0].lostAtDate).toBe('2025-03-15')
  })

  it('treats NOT_PRESCRIBED doseTier as absent', () => {
    const timeline = makeTimeline([
      makeEntry('2025-01-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
      ], [
        { date: '2025-01-15', type: 'visit', description: 'Visit 1' },
      ]),
      makeEntry('2025-03-15', [
        makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.NOT_PRESCRIBED),
      ], [
        { date: '2025-03-15', type: 'visit', description: 'Visit 2' },
      ]),
    ])
    const result = detectTransitionGaps(timeline)
    expect(result).toHaveLength(1)
    expect(result[0].pillar).toBe(PILLARS.ARNI_ACEi_ARB)
  })

  it('does not mutate the original timeline entries', () => {
    const entry1 = makeEntry('2025-03-15', [
      makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
    ])
    const entry2 = makeEntry('2025-01-15', [
      makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
      makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
    ])
    const timeline = makeTimeline([entry1, entry2])

    detectTransitionGaps(timeline)

    // Entries should remain in original order (reverse chronological)
    expect(timeline.entries[0]).toBe(entry1)
    expect(timeline.entries[1]).toBe(entry2)
    expect(timeline.entries[0].date).toBe('2025-03-15')
    expect(timeline.entries[1].date).toBe('2025-01-15')
  })
})
