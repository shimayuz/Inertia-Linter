import type { Pillar } from '../types/index.ts'
import { getThresholdsForPillar } from '../data/load-ruleset.ts'

export function getEGFRThreshold(
  pillar: Pillar,
  isInitiation: boolean,
): number | null {
  const thresholds = getThresholdsForPillar(pillar)
  const value = isInitiation ? thresholds.egfr_init : thresholds.egfr_cont
  return value ?? null
}
