import type { PatientTimeline } from '../types/timeline.ts'
import type { Pillar } from '../types/pillar.ts'
import type { DoseTier } from '../types/dose-tier.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'

export interface ScoreDataPoint {
  readonly date: string
  readonly score: number
  readonly maxPossible: number
  readonly normalized: number
}

export interface MedicationDataPoint {
  readonly date: string
  readonly pillar: Pillar
  readonly pillarLabel: string
  readonly doseTier: DoseTier
  readonly drugName: string
}

export interface LabDataPoint {
  readonly date: string
  readonly egfr: number | null
  readonly potassium: number | null
  readonly sbp: number
  readonly hr: number
}

export function toScoreProgression(timeline: PatientTimeline): ReadonlyArray<ScoreDataPoint> {
  return timeline.entries.map(entry => ({
    date: entry.date,
    score: entry.auditResult.gdmtScore.score,
    maxPossible: entry.auditResult.gdmtScore.maxPossible,
    normalized: entry.auditResult.gdmtScore.normalized,
  }))
}

export function toMedicationTimeline(timeline: PatientTimeline): ReadonlyArray<MedicationDataPoint> {
  return timeline.entries.flatMap(entry =>
    entry.snapshot.medications.map(med => ({
      date: entry.date,
      pillar: med.pillar,
      pillarLabel: PILLAR_LABELS[med.pillar],
      doseTier: med.doseTier,
      drugName: med.name,
    }))
  )
}

export function toLabTrends(timeline: PatientTimeline): ReadonlyArray<LabDataPoint> {
  return timeline.entries.map(entry => ({
    date: entry.date,
    egfr: entry.snapshot.egfr ?? null,
    potassium: entry.snapshot.potassium ?? null,
    sbp: entry.snapshot.sbp,
    hr: entry.snapshot.hr,
  }))
}

export function generateJourneySummary(timeline: PatientTimeline): string {
  const first = timeline.entries[0]
  const last = timeline.entries[timeline.entries.length - 1]
  if (!first || !last) return ''

  const firstScore = first.auditResult.gdmtScore.score
  const lastScore = last.auditResult.gdmtScore.score
  const delta = lastScore - firstScore
  const direction = delta > 0 ? 'improved' : delta < 0 ? 'declined' : 'unchanged'

  const totalEvents = timeline.entries.reduce(
    (sum, e) => sum + e.events.length,
    0,
  )

  const medChanges = timeline.entries.reduce(
    (sum, e) => sum + e.events.filter(ev =>
      ev.type === 'med_start' || ev.type === 'med_change' || ev.type === 'med_stop'
    ).length,
    0,
  )

  return `Over ${timeline.entries.length} visits from ${first.date} to ${last.date}, GDMT score ${direction} from ${firstScore} to ${lastScore} (${delta >= 0 ? '+' : ''}${delta} points). ${totalEvents} clinical events recorded, including ${medChanges} medication changes.`
}
