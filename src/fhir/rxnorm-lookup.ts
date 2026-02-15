import type { Pillar } from '../types/pillar.ts'
import type { DoseTier } from '../types/dose-tier.ts'

// ---------------------------------------------------------------------------
// RxNorm mapping interface
// ---------------------------------------------------------------------------

export interface RxNormMapping {
  readonly rxnorm: string
  readonly name: string
  readonly pillar: Pillar
  readonly doseMg: number
  readonly frequency: 'BID' | 'daily'
  readonly doseTier: DoseTier
}

// ---------------------------------------------------------------------------
// RxNorm lookup table
// ---------------------------------------------------------------------------

export const RXNORM_TABLE: ReadonlyArray<RxNormMapping> = [
  // --- ARNI: Sacubitril/Valsartan ---
  { rxnorm: '1656354', name: 'Sacubitril/Valsartan', pillar: 'ARNI_ACEi_ARB', doseMg: 24, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '1656355', name: 'Sacubitril/Valsartan', pillar: 'ARNI_ACEi_ARB', doseMg: 49, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '1656356', name: 'Sacubitril/Valsartan', pillar: 'ARNI_ACEi_ARB', doseMg: 97, frequency: 'BID', doseTier: 'HIGH' },

  // --- ACEi/ARB: Enalapril ---
  { rxnorm: '29046', name: 'Enalapril', pillar: 'ARNI_ACEi_ARB', doseMg: 2.5, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '29046', name: 'Enalapril', pillar: 'ARNI_ACEi_ARB', doseMg: 5, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '29046', name: 'Enalapril', pillar: 'ARNI_ACEi_ARB', doseMg: 10, frequency: 'BID', doseTier: 'HIGH' },

  // --- ACEi/ARB: Lisinopril ---
  { rxnorm: '104377', name: 'Lisinopril', pillar: 'ARNI_ACEi_ARB', doseMg: 5, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '104377', name: 'Lisinopril', pillar: 'ARNI_ACEi_ARB', doseMg: 20, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '104377', name: 'Lisinopril', pillar: 'ARNI_ACEi_ARB', doseMg: 40, frequency: 'daily', doseTier: 'HIGH' },

  // --- ACEi/ARB: Losartan ---
  { rxnorm: '52175', name: 'Losartan', pillar: 'ARNI_ACEi_ARB', doseMg: 25, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '52175', name: 'Losartan', pillar: 'ARNI_ACEi_ARB', doseMg: 100, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '52175', name: 'Losartan', pillar: 'ARNI_ACEi_ARB', doseMg: 150, frequency: 'daily', doseTier: 'HIGH' },

  // --- ACEi/ARB: Valsartan ---
  { rxnorm: '69749', name: 'Valsartan', pillar: 'ARNI_ACEi_ARB', doseMg: 40, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '69749', name: 'Valsartan', pillar: 'ARNI_ACEi_ARB', doseMg: 80, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '69749', name: 'Valsartan', pillar: 'ARNI_ACEi_ARB', doseMg: 160, frequency: 'BID', doseTier: 'HIGH' },

  // --- Beta-blocker: Carvedilol ---
  { rxnorm: '20352', name: 'Carvedilol', pillar: 'BETA_BLOCKER', doseMg: 3.125, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '20352', name: 'Carvedilol', pillar: 'BETA_BLOCKER', doseMg: 6.25, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '20352', name: 'Carvedilol', pillar: 'BETA_BLOCKER', doseMg: 12.5, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '20352', name: 'Carvedilol', pillar: 'BETA_BLOCKER', doseMg: 25, frequency: 'BID', doseTier: 'HIGH' },

  // --- Beta-blocker: Metoprolol Succinate ---
  { rxnorm: '866924', name: 'Metoprolol Succinate', pillar: 'BETA_BLOCKER', doseMg: 25, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '866924', name: 'Metoprolol Succinate', pillar: 'BETA_BLOCKER', doseMg: 50, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '866924', name: 'Metoprolol Succinate', pillar: 'BETA_BLOCKER', doseMg: 100, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '866924', name: 'Metoprolol Succinate', pillar: 'BETA_BLOCKER', doseMg: 200, frequency: 'daily', doseTier: 'HIGH' },

  // --- MRA: Spironolactone ---
  { rxnorm: '9997', name: 'Spironolactone', pillar: 'MRA', doseMg: 12.5, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '9997', name: 'Spironolactone', pillar: 'MRA', doseMg: 25, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '9997', name: 'Spironolactone', pillar: 'MRA', doseMg: 50, frequency: 'daily', doseTier: 'HIGH' },

  // --- MRA: Eplerenone ---
  { rxnorm: '298869', name: 'Eplerenone', pillar: 'MRA', doseMg: 25, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '298869', name: 'Eplerenone', pillar: 'MRA', doseMg: 50, frequency: 'daily', doseTier: 'HIGH' },

  // --- SGLT2i: Dapagliflozin ---
  { rxnorm: '1488564', name: 'Dapagliflozin', pillar: 'SGLT2i', doseMg: 10, frequency: 'daily', doseTier: 'HIGH' },

  // --- SGLT2i: Empagliflozin ---
  { rxnorm: '1545653', name: 'Empagliflozin', pillar: 'SGLT2i', doseMg: 10, frequency: 'daily', doseTier: 'HIGH' },
] as const

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

/**
 * Find the best RxNorm mapping for a given code and dose.
 * Matches by RxNorm code, then selects the entry whose doseMg is closest
 * to the provided doseMg. Returns undefined if no entry matches the code.
 */
export function lookupMedication(
  rxnormCode: string,
  doseMg: number,
): RxNormMapping | undefined {
  const candidates = RXNORM_TABLE.filter(
    (entry) => entry.rxnorm === rxnormCode,
  )

  if (candidates.length === 0) {
    return undefined
  }

  let bestMatch = candidates[0]
  let bestDistance = Math.abs(candidates[0].doseMg - doseMg)

  for (let i = 1; i < candidates.length; i++) {
    const distance = Math.abs(candidates[i].doseMg - doseMg)
    if (distance < bestDistance) {
      bestMatch = candidates[i]
      bestDistance = distance
    }
  }

  return bestMatch
}

/**
 * Find a medication by display name (case-insensitive, partial match).
 * Returns the first entry whose name contains the search string.
 * Useful for converting FHIR medicationCodeableConcept.text to a mapping.
 */
export function lookupMedicationByName(
  displayName: string,
): RxNormMapping | undefined {
  const normalized = displayName.toLowerCase().trim()

  if (normalized.length === 0) {
    return undefined
  }

  return RXNORM_TABLE.find(
    (entry) => entry.name.toLowerCase().includes(normalized)
      || normalized.includes(entry.name.toLowerCase()),
  )
}
