import type { MedicationAlternative } from '../types/resolution.ts'

export const MRA_ALTERNATIVES: ReadonlyArray<MedicationAlternative> = [
  {
    drugName: 'Spironolactone',
    genericName: 'spironolactone',
    pillar: 'MRA',
    isGeneric: true,
    estimatedMonthlyCost: '$4',
    formularyLikelihood: 'high',
    clinicalEquivalence: 'equivalent',
    guidelineSupport: 'AHA Class I LOE A for MRA in HFrEF (RALES: 30% mortality reduction)',
    switchConsiderations: [
      'First-line generic MRA for HFrEF',
      'Start at 12.5-25mg daily, target 25-50mg daily',
      'Monitor potassium and renal function at 1 week and 4 weeks',
      'Risk of gynecomastia (9%) and breast pain',
      'Available on $4 generic programs at most pharmacies',
    ],
  },
  {
    drugName: 'Eplerenone',
    genericName: 'eplerenone',
    pillar: 'MRA',
    isGeneric: true,
    estimatedMonthlyCost: '$30-85',
    formularyLikelihood: 'medium',
    clinicalEquivalence: 'equivalent',
    guidelineSupport: 'AHA Class I LOE B-R for MRA in HFrEF (EPHESUS, EMPHASIS-HF)',
    switchConsiderations: [
      'More selective aldosterone antagonist',
      'Lower risk of gynecomastia than spironolactone',
      'Start at 25mg daily, target 50mg daily',
      'Higher cost than spironolactone; may require PA',
      'Preferred if gynecomastia is a concern',
    ],
  },
] as const
