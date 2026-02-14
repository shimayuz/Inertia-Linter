import type { DoseTier } from '../types/index.ts'
import { DOSE_TIER_POINTS } from '../types/index.ts'

export function getDoseTierPoints(tier: DoseTier): number {
  return DOSE_TIER_POINTS[tier]
}
