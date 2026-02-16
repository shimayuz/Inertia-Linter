import type { PatientTimeline, TimelineEntry } from '../types/timeline.ts'
import type { Pillar } from '../types/pillar.ts'

export interface TransitionGap {
  readonly pillar: Pillar
  readonly lostAtDate: string
  readonly lastPresentDate: string
  readonly fromEntry: string
  readonly toEntry: string
}

/**
 * Returns the set of pillars that are actively prescribed in a timeline entry.
 * A medication is "present" if its doseTier is not 'NOT_PRESCRIBED'.
 */
function getPrescribedPillars(entry: TimelineEntry): ReadonlySet<Pillar> {
  const pillars = new Set<Pillar>()
  for (const med of entry.snapshot.medications) {
    if (med.doseTier !== 'NOT_PRESCRIBED') {
      pillars.add(med.pillar)
    }
  }
  return pillars
}

/**
 * Builds a human-readable label for a timeline entry from its events.
 * Falls back to a date-based label if no events are present.
 */
function getEntryLabel(entry: TimelineEntry): string {
  if (entry.events.length > 0) {
    const visitEvent = entry.events.find(
      (e) => e.type === 'visit' || e.type === 'hospitalization' || e.type === 'discharge' || e.type === 'transfer',
    )
    if (visitEvent) {
      return visitEvent.description
    }
    return entry.events[0].description
  }
  return `Entry on ${entry.date}`
}

/**
 * Detects medications that were present in an earlier timeline entry
 * but absent in a later entry, indicating a care transition gap.
 *
 * Compares consecutive timeline entries. If a medication is present
 * (doseTier !== 'NOT_PRESCRIBED') in entry N but absent or NOT_PRESCRIBED
 * in entry N+1, it's flagged as a transition gap.
 *
 * Pure function — no side effects.
 */
export function detectTransitionGaps(
  timeline: PatientTimeline,
): ReadonlyArray<TransitionGap> {
  if (timeline.entries.length < 2) {
    return []
  }

  const sorted = [...timeline.entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const gaps: TransitionGap[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentPillars = getPrescribedPillars(current)
    const nextPillars = getPrescribedPillars(next)

    for (const pillar of currentPillars) {
      if (!nextPillars.has(pillar)) {
        gaps.push({
          pillar,
          lostAtDate: next.date,
          lastPresentDate: current.date,
          fromEntry: getEntryLabel(current),
          toEntry: getEntryLabel(next),
        })
      }
    }
  }

  return gaps
}
