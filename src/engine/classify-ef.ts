import type { EFCategory } from '../types'
import { EF_THRESHOLDS } from '../types'

export function classifyEF(ef: number): EFCategory {
  if (ef <= EF_THRESHOLDS.HFrEF_MAX) {
    return 'HFrEF'
  }
  if (ef <= EF_THRESHOLDS.HFmrEF_MAX) {
    return 'HFmrEF'
  }
  return 'HFpEF'
}
