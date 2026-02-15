import type { Pillar } from '../types/pillar'
import type { DoseTier } from '../types/dose-tier'
import type { DrugTargetDose } from '../types/target-dose'
import { TARGET_DOSES } from '../data/target-doses'

export function matchTargetDose(
  pillar: Pillar,
  drugName: string,
): DrugTargetDose | null {
  const candidates = TARGET_DOSES[pillar]
  const query = drugName.toLowerCase()

  for (const drug of candidates) {
    const genericMatch = query.includes(drug.genericName.toLowerCase())
    const brandMatch =
      drug.brandName !== undefined &&
      query.includes(drug.brandName.toLowerCase())
    const drugNameMatch = query.includes(drug.drugName.toLowerCase())

    if (genericMatch || brandMatch || drugNameMatch) {
      return drug
    }
  }

  return null
}

export function getCurrentStepIndex(
  targetDose: DrugTargetDose,
  currentTier: DoseTier,
): number {
  if (currentTier === 'NOT_PRESCRIBED') {
    return -1
  }

  return targetDose.steps.findIndex((step) => step.tier === currentTier)
}
