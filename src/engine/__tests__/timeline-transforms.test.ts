import { describe, it, expect } from 'vitest'
import {
  toScoreProgression,
  toMedicationTimeline,
  toLabTrends,
  generateJourneySummary,
} from '../timeline-transforms.ts'
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
    medications: [
      makeMedication(PILLARS.ARNI_ACEi_ARB, 'sacubitril/valsartan', DOSE_TIERS.LOW),
      makeMedication(PILLARS.BETA_BLOCKER, 'carvedilol', DOSE_TIERS.MEDIUM),
      makeMedication(PILLARS.MRA, 'spironolactone', DOSE_TIERS.LOW),
      makeMedication(PILLARS.SGLT2i, 'dapagliflozin', DOSE_TIERS.HIGH),
    ],
    ...overrides,
  }
}

function makeAuditResult(score: number, maxPossible: number): AuditResult {
  const normalized = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0
  return {
    efCategory: 'HFrEF',
    pillarResults: [
      { pillar: PILLARS.ARNI_ACEi_ARB, status: 'UNDERDOSED', doseTier: DOSE_TIERS.LOW, blockers: [], missingInfo: [] },
      { pillar: PILLARS.BETA_BLOCKER, status: 'UNDERDOSED', doseTier: DOSE_TIERS.MEDIUM, blockers: [], missingInfo: [] },
      { pillar: PILLARS.MRA, status: 'UNDERDOSED', doseTier: DOSE_TIERS.LOW, blockers: [], missingInfo: [] },
      { pillar: PILLARS.SGLT2i, status: 'ON_TARGET', doseTier: DOSE_TIERS.HIGH, blockers: [], missingInfo: [] },
    ],
    gdmtScore: {
      score,
      maxPossible,
      normalized,
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
  score: number,
  maxPossible: number,
  events: ReadonlyArray<ClinicalEvent> = [],
  snapshotOverrides: Partial<PatientSnapshot> = {},
): TimelineEntry {
  return {
    date,
    snapshot: makeSnapshot(snapshotOverrides),
    auditResult: makeAuditResult(score, maxPossible),
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

// 3-entry mock timeline for comprehensive testing
const MOCK_EVENTS_VISIT1: ReadonlyArray<ClinicalEvent> = [
  { date: '2025-01-15', type: 'visit', description: 'Initial cardiology visit' },
  { date: '2025-01-15', type: 'med_start', description: 'Started sacubitril/valsartan 24/26 mg BID', pillar: PILLARS.ARNI_ACEi_ARB },
  { date: '2025-01-15', type: 'lab', description: 'Baseline labs drawn' },
]

const MOCK_EVENTS_VISIT2: ReadonlyArray<ClinicalEvent> = [
  { date: '2025-03-15', type: 'visit', description: 'Follow-up visit' },
  { date: '2025-03-15', type: 'med_change', description: 'Up-titrated sacubitril/valsartan to 49/51 mg BID', pillar: PILLARS.ARNI_ACEi_ARB },
]

const MOCK_EVENTS_VISIT3: ReadonlyArray<ClinicalEvent> = [
  { date: '2025-06-15', type: 'visit', description: '6-month follow-up' },
  { date: '2025-06-15', type: 'med_stop', description: 'Held spironolactone due to K+ 5.6', pillar: PILLARS.MRA },
  { date: '2025-06-10', type: 'hospitalization', description: 'Brief admission for volume overload' },
]

const MOCK_TIMELINE = makeTimeline([
  makeEntry('2025-01-15', 24, 100, MOCK_EVENTS_VISIT1),
  makeEntry('2025-03-15', 49, 100, MOCK_EVENTS_VISIT2, { sbp: 110, hr: 68, egfr: 55, potassium: 4.5 }),
  makeEntry('2025-06-15', 41, 100, MOCK_EVENTS_VISIT3, { sbp: 105, hr: 65, egfr: undefined, potassium: undefined }),
])

describe('toScoreProgression', () => {
  it('returns one data point per timeline entry', () => {
    const result = toScoreProgression(MOCK_TIMELINE)
    expect(result).toHaveLength(3)
  })

  it('returns correct date for each entry', () => {
    const result = toScoreProgression(MOCK_TIMELINE)
    expect(result[0].date).toBe('2025-01-15')
    expect(result[1].date).toBe('2025-03-15')
    expect(result[2].date).toBe('2025-06-15')
  })

  it('returns correct score for each entry', () => {
    const result = toScoreProgression(MOCK_TIMELINE)
    expect(result[0].score).toBe(24)
    expect(result[1].score).toBe(49)
    expect(result[2].score).toBe(41)
  })

  it('returns correct maxPossible for each entry', () => {
    const result = toScoreProgression(MOCK_TIMELINE)
    expect(result[0].maxPossible).toBe(100)
    expect(result[1].maxPossible).toBe(100)
    expect(result[2].maxPossible).toBe(100)
  })

  it('returns correct normalized score for each entry', () => {
    const result = toScoreProgression(MOCK_TIMELINE)
    expect(result[0].normalized).toBe(24)
    expect(result[1].normalized).toBe(49)
    expect(result[2].normalized).toBe(41)
  })

  it('returns empty array for empty timeline', () => {
    const emptyTimeline = makeTimeline([])
    const result = toScoreProgression(emptyTimeline)
    expect(result).toEqual([])
  })
})

describe('toMedicationTimeline', () => {
  it('returns 4 data points per entry (one per pillar) when each entry has 4 medications', () => {
    const result = toMedicationTimeline(MOCK_TIMELINE)
    // 3 entries * 4 medications each = 12
    expect(result).toHaveLength(12)
  })

  it('returns correct pillarLabel for each data point', () => {
    const result = toMedicationTimeline(MOCK_TIMELINE)
    const firstFour = result.slice(0, 4)
    expect(firstFour[0].pillarLabel).toBe('ARNI/ACEi/ARB')
    expect(firstFour[1].pillarLabel).toBe('Beta-blocker')
    expect(firstFour[2].pillarLabel).toBe('MRA')
    expect(firstFour[3].pillarLabel).toBe('SGLT2i')
  })

  it('returns correct doseTier for each data point', () => {
    const result = toMedicationTimeline(MOCK_TIMELINE)
    expect(result[0].doseTier).toBe(DOSE_TIERS.LOW)
    expect(result[1].doseTier).toBe(DOSE_TIERS.MEDIUM)
    expect(result[2].doseTier).toBe(DOSE_TIERS.LOW)
    expect(result[3].doseTier).toBe(DOSE_TIERS.HIGH)
  })

  it('returns correct drugName for each data point', () => {
    const result = toMedicationTimeline(MOCK_TIMELINE)
    expect(result[0].drugName).toBe('sacubitril/valsartan')
    expect(result[1].drugName).toBe('carvedilol')
    expect(result[2].drugName).toBe('spironolactone')
    expect(result[3].drugName).toBe('dapagliflozin')
  })

  it('returns correct date for each data point', () => {
    const result = toMedicationTimeline(MOCK_TIMELINE)
    // First 4 belong to entry 1
    expect(result[0].date).toBe('2025-01-15')
    expect(result[3].date).toBe('2025-01-15')
    // Next 4 belong to entry 2
    expect(result[4].date).toBe('2025-03-15')
    // Last 4 belong to entry 3
    expect(result[8].date).toBe('2025-06-15')
  })

  it('returns empty array for empty timeline', () => {
    const emptyTimeline = makeTimeline([])
    const result = toMedicationTimeline(emptyTimeline)
    expect(result).toEqual([])
  })

  it('handles entries with fewer medications', () => {
    const sparseTimeline = makeTimeline([
      makeEntry('2025-01-15', 24, 100, [], {
        medications: [
          makeMedication(PILLARS.SGLT2i, 'dapagliflozin', DOSE_TIERS.HIGH),
        ],
      }),
    ])
    const result = toMedicationTimeline(sparseTimeline)
    expect(result).toHaveLength(1)
    expect(result[0].pillar).toBe(PILLARS.SGLT2i)
  })
})

describe('toLabTrends', () => {
  it('returns one data point per timeline entry', () => {
    const result = toLabTrends(MOCK_TIMELINE)
    expect(result).toHaveLength(3)
  })

  it('returns correct sbp and hr for each entry', () => {
    const result = toLabTrends(MOCK_TIMELINE)
    expect(result[0].sbp).toBe(120)
    expect(result[0].hr).toBe(72)
    expect(result[1].sbp).toBe(110)
    expect(result[1].hr).toBe(68)
    expect(result[2].sbp).toBe(105)
    expect(result[2].hr).toBe(65)
  })

  it('returns egfr value when present', () => {
    const result = toLabTrends(MOCK_TIMELINE)
    expect(result[0].egfr).toBe(60)
    expect(result[1].egfr).toBe(55)
  })

  it('returns potassium value when present', () => {
    const result = toLabTrends(MOCK_TIMELINE)
    expect(result[0].potassium).toBe(4.2)
    expect(result[1].potassium).toBe(4.5)
  })

  it('handles missing egfr as null', () => {
    const result = toLabTrends(MOCK_TIMELINE)
    expect(result[2].egfr).toBeNull()
  })

  it('handles missing potassium as null', () => {
    const result = toLabTrends(MOCK_TIMELINE)
    expect(result[2].potassium).toBeNull()
  })

  it('returns correct dates', () => {
    const result = toLabTrends(MOCK_TIMELINE)
    expect(result[0].date).toBe('2025-01-15')
    expect(result[1].date).toBe('2025-03-15')
    expect(result[2].date).toBe('2025-06-15')
  })

  it('returns empty array for empty timeline', () => {
    const emptyTimeline = makeTimeline([])
    const result = toLabTrends(emptyTimeline)
    expect(result).toEqual([])
  })
})

describe('generateJourneySummary', () => {
  it('returns "improved" when score increases overall', () => {
    const improvingTimeline = makeTimeline([
      makeEntry('2025-01-15', 24, 100, MOCK_EVENTS_VISIT1),
      makeEntry('2025-06-15', 75, 100, MOCK_EVENTS_VISIT2),
    ])
    const summary = generateJourneySummary(improvingTimeline)
    expect(summary).toContain('improved')
    expect(summary).toContain('from 24 to 75')
  })

  it('returns "declined" when score decreases overall', () => {
    const decliningTimeline = makeTimeline([
      makeEntry('2025-01-15', 75, 100, MOCK_EVENTS_VISIT1),
      makeEntry('2025-06-15', 41, 100, MOCK_EVENTS_VISIT3),
    ])
    const summary = generateJourneySummary(decliningTimeline)
    expect(summary).toContain('declined')
    expect(summary).toContain('from 75 to 41')
  })

  it('returns "unchanged" when score stays the same', () => {
    const unchangedTimeline = makeTimeline([
      makeEntry('2025-01-15', 50, 100),
      makeEntry('2025-06-15', 50, 100),
    ])
    const summary = generateJourneySummary(unchangedTimeline)
    expect(summary).toContain('unchanged')
  })

  it('includes correct total event count', () => {
    // MOCK_TIMELINE: visit1 has 3 events, visit2 has 2 events, visit3 has 3 events = 8 total
    const summary = generateJourneySummary(MOCK_TIMELINE)
    expect(summary).toContain('8 clinical events')
  })

  it('includes correct medication change count', () => {
    // MOCK_TIMELINE: med_start(1) + med_change(1) + med_stop(1) = 3 medication changes
    const summary = generateJourneySummary(MOCK_TIMELINE)
    expect(summary).toContain('3 medication changes')
  })

  it('includes date range', () => {
    const summary = generateJourneySummary(MOCK_TIMELINE)
    expect(summary).toContain('2025-01-15')
    expect(summary).toContain('2025-06-15')
  })

  it('includes visit count', () => {
    const summary = generateJourneySummary(MOCK_TIMELINE)
    expect(summary).toContain('3 visits')
  })

  it('returns empty string for empty timeline', () => {
    const emptyTimeline = makeTimeline([])
    const summary = generateJourneySummary(emptyTimeline)
    expect(summary).toBe('')
  })

  it('handles single-entry timeline', () => {
    const singleTimeline = makeTimeline([
      makeEntry('2025-01-15', 50, 100, MOCK_EVENTS_VISIT1),
    ])
    const summary = generateJourneySummary(singleTimeline)
    expect(summary).toContain('unchanged')
    expect(summary).toContain('1 visits')
    expect(summary).toContain('from 50 to 50')
  })

  it('shows positive delta with + prefix', () => {
    const improvingTimeline = makeTimeline([
      makeEntry('2025-01-15', 24, 100),
      makeEntry('2025-06-15', 75, 100),
    ])
    const summary = generateJourneySummary(improvingTimeline)
    expect(summary).toContain('+51 points')
  })

  it('shows negative delta without + prefix', () => {
    const decliningTimeline = makeTimeline([
      makeEntry('2025-01-15', 75, 100),
      makeEntry('2025-06-15', 41, 100),
    ])
    const summary = generateJourneySummary(decliningTimeline)
    expect(summary).toContain('-34 points')
  })
})
