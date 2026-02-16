import type { MedicationAlternative } from '../types/resolution.ts'

export const SGLT2I_ALTERNATIVES: ReadonlyArray<MedicationAlternative> = [
  {
    drugName: 'Dapagliflozin',
    genericName: 'dapagliflozin',
    pillar: 'SGLT2i',
    isGeneric: false,
    estimatedMonthlyCost: '$550',
    formularyLikelihood: 'medium',
    clinicalEquivalence: 'equivalent',
    guidelineSupport: 'AHA Class I LOE A for SGLT2i in HFrEF (DAPA-HF: 26% reduction in CV death/HF hospitalization)',
    switchConsiderations: [
      'Fixed 10mg daily dose for HF',
      'No dose titration required',
      'Can be used with eGFR down to 20 (continuation) or 25 (initiation)',
      'FDA-approved for HFrEF and HFpEF',
    ],
  },
  {
    drugName: 'Empagliflozin',
    genericName: 'empagliflozin',
    pillar: 'SGLT2i',
    isGeneric: false,
    estimatedMonthlyCost: '$550',
    formularyLikelihood: 'medium',
    clinicalEquivalence: 'equivalent',
    guidelineSupport: 'AHA Class I LOE A for SGLT2i in HFrEF (EMPEROR-Reduced: 25% reduction in CV death/HF hospitalization)',
    switchConsiderations: [
      'Fixed 10mg daily dose for HF',
      'No dose titration required',
      'FDA-approved for HFrEF and HFpEF',
      'EMPEROR-Preserved showed benefit in HFpEF',
    ],
  },
] as const
