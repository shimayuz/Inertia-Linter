import type { PatientSnapshot, PillarResult } from '../types/index.ts'
import { PILLARS, PILLAR_STATUSES } from '../types/index.ts'
import { getDoseTierPoints } from './match-dose-tier.ts'

const SGLT2I_MAX_POINTS = 40
const BP_CONTROLLED_POINTS = 20
const FINERENONE_POINTS = 20
const HFPEF_MAX = 100
const BP_THRESHOLD = 130
const MAX_DOSE_POINTS = 25

export function calculateHFpEFScore(
  patient: PatientSnapshot,
  pillarResults: ReadonlyArray<PillarResult>,
): { readonly score: number; readonly maxPossible: number; readonly label: string } {
  let score = 0

  const sglt2iResult = pillarResults.find(
    (r) => r.pillar === PILLARS.SGLT2i,
  )

  if (sglt2iResult && sglt2iResult.status !== PILLAR_STATUSES.MISSING
    && sglt2iResult.status !== PILLAR_STATUSES.CONTRAINDICATED) {
    const points = getDoseTierPoints(sglt2iResult.doseTier)
    score += Math.round((points / MAX_DOSE_POINTS) * SGLT2I_MAX_POINTS)
  }

  if (patient.sbp < BP_THRESHOLD) {
    score += BP_CONTROLLED_POINTS
  }

  if (patient.dmType === 'type2') {
    score += FINERENONE_POINTS
  }

  return {
    score,
    maxPossible: HFPEF_MAX,
    label: 'HFpEF Management Score',
  }
}
