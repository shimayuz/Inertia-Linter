import type { PillarResult, GDMTScore, Pillar } from '../types/index.ts'
import { PILLAR_STATUSES } from '../types/index.ts'
import { getDoseTierPoints } from './match-dose-tier.ts'

const MAX_POINTS_PER_PILLAR = 25

export function calculateGDMTScore(
  pillarResults: ReadonlyArray<PillarResult>,
): GDMTScore {
  const excludedPillars: Pillar[] = []
  let score = 0
  let maxPossible = 0
  let isIncomplete = false

  for (const result of pillarResults) {
    if (result.status === PILLAR_STATUSES.CONTRAINDICATED) {
      excludedPillars.push(result.pillar)
      continue
    }

    if (result.status === PILLAR_STATUSES.UNKNOWN) {
      isIncomplete = true
    }

    score += getDoseTierPoints(result.doseTier)
    maxPossible += MAX_POINTS_PER_PILLAR
  }

  const normalized = maxPossible > 0
    ? Math.round((score / maxPossible) * 100)
    : 0

  return {
    score,
    maxPossible,
    normalized,
    excludedPillars,
    isIncomplete,
  }
}
