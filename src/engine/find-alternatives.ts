import type { Pillar } from '../types/pillar.ts'
import type { BlockerCode } from '../types/blocker.ts'
import type { MedicationAlternative, AssistanceProgram } from '../types/resolution.ts'
import { ARNI_ALTERNATIVES } from '../data/alternatives-arni.ts'
import { MRA_ALTERNATIVES } from '../data/alternatives-mra.ts'
import { SGLT2I_ALTERNATIVES } from '../data/alternatives-sglt2i.ts'
import { ASSISTANCE_PROGRAMS } from '../data/assistance-programs.ts'

// ---------------------------------------------------------------------------
// Alternatives lookup (static data, pure function)
// ---------------------------------------------------------------------------

const ALTERNATIVES_BY_PILLAR: Readonly<Record<Pillar, ReadonlyArray<MedicationAlternative>>> = {
  ARNI_ACEi_ARB: ARNI_ALTERNATIVES,
  BETA_BLOCKER: [],
  MRA: MRA_ALTERNATIVES,
  SGLT2i: SGLT2I_ALTERNATIVES,
} as const

export function findAlternatives(
  pillar: Pillar,
  currentDrug: string,
  _blockerCode: BlockerCode,
): ReadonlyArray<MedicationAlternative> {
  const alternatives = ALTERNATIVES_BY_PILLAR[pillar]
  if (alternatives.length === 0) {
    return []
  }

  const lowerCurrent = currentDrug.toLowerCase()

  // Filter out the current drug, prioritize generics and lowest cost
  return alternatives
    .filter((alt) => !lowerCurrent.includes(alt.drugName.toLowerCase()))
    .sort((a, b) => {
      // Generics first
      if (a.isGeneric && !b.isGeneric) return -1
      if (!a.isGeneric && b.isGeneric) return 1
      // High formulary likelihood first
      const likelihoodOrder = { high: 0, medium: 1, low: 2 }
      return likelihoodOrder[a.formularyLikelihood] - likelihoodOrder[b.formularyLikelihood]
    })
}

// ---------------------------------------------------------------------------
// Assistance programs lookup
// ---------------------------------------------------------------------------

const PILLAR_DRUG_KEYWORDS: Readonly<Record<Pillar, ReadonlyArray<string>>> = {
  ARNI_ACEi_ARB: ['entresto', 'sacubitril', 'enalapril', 'lisinopril', 'losartan', 'acei', 'arb'],
  BETA_BLOCKER: ['carvedilol', 'metoprolol', 'bisoprolol', 'beta-blocker'],
  MRA: ['spironolactone', 'eplerenone', 'inspra'],
  SGLT2i: ['dapagliflozin', 'empagliflozin', 'farxiga', 'jardiance', 'sglt2'],
} as const

export function findAssistancePrograms(
  pillar: Pillar,
  drugName: string,
): ReadonlyArray<AssistanceProgram> {
  const keywords = PILLAR_DRUG_KEYWORDS[pillar]
  const lowerDrug = drugName.toLowerCase()

  return ASSISTANCE_PROGRAMS.filter((program) => {
    // Match by drug name
    const matchesDrugName = program.drugsCovered.some((covered) => {
      const lowerCovered = covered.toLowerCase()
      return lowerDrug.includes(lowerCovered) || lowerCovered.includes(lowerDrug)
    })

    // Match by pillar keywords
    const matchesKeyword = program.drugsCovered.some((covered) => {
      const lowerCovered = covered.toLowerCase()
      return keywords.some((kw) => lowerCovered.includes(kw))
    })

    return matchesDrugName || matchesKeyword
  })
}
