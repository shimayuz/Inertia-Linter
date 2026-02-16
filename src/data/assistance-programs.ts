import type { AssistanceProgram } from '../types/resolution.ts'

export const ASSISTANCE_PROGRAMS: ReadonlyArray<AssistanceProgram> = [
  {
    id: 'novartis-pap-entresto',
    programName: 'Novartis Patient Assistance Foundation',
    manufacturer: 'Novartis',
    drugsCovered: ['Entresto (sacubitril/valsartan)'],
    eligibilityCriteria: [
      'US resident',
      'No prescription drug coverage or underinsured',
      'Income at or below 500% of Federal Poverty Level',
    ],
    estimatedSavings: 'Free medication',
    programType: 'pap',
  },
  {
    id: 'novartis-copay-entresto',
    programName: 'Entresto Copay Savings Card',
    manufacturer: 'Novartis',
    drugsCovered: ['Entresto (sacubitril/valsartan)'],
    eligibilityCriteria: [
      'Commercial insurance required',
      'Not eligible for government-funded programs',
    ],
    estimatedSavings: 'Pay as little as $10/month',
    programType: 'copay_card',
  },
  {
    id: 'az-pap-farxiga',
    programName: 'AstraZeneca Patient Assistance Program',
    manufacturer: 'AstraZeneca',
    drugsCovered: ['Farxiga (dapagliflozin)'],
    eligibilityCriteria: [
      'US resident',
      'No prescription coverage or coverage gap',
      'Income at or below 400% of Federal Poverty Level',
    ],
    estimatedSavings: 'Free medication',
    programType: 'pap',
  },
  {
    id: 'az-copay-farxiga',
    programName: 'Farxiga Savings Card',
    manufacturer: 'AstraZeneca',
    drugsCovered: ['Farxiga (dapagliflozin)'],
    eligibilityCriteria: [
      'Commercial insurance required',
      'Not for government-funded programs',
    ],
    estimatedSavings: 'Pay as little as $0/month',
    programType: 'copay_card',
  },
  {
    id: 'lilly-pap-jardiance',
    programName: 'Lilly Cares Foundation',
    manufacturer: 'Boehringer Ingelheim / Eli Lilly',
    drugsCovered: ['Jardiance (empagliflozin)'],
    eligibilityCriteria: [
      'US resident',
      'No prescription coverage',
      'Income at or below 400% of Federal Poverty Level',
    ],
    estimatedSavings: 'Free medication',
    programType: 'pap',
  },
  {
    id: 'merck-pap-inspra',
    programName: 'Merck Patient Assistance Program',
    manufacturer: 'Pfizer (formerly Merck)',
    drugsCovered: ['Inspra (eplerenone)'],
    eligibilityCriteria: [
      'US resident',
      'No prescription coverage or underinsured',
      'Income at or below 400% of Federal Poverty Level',
    ],
    estimatedSavings: 'Free medication',
    programType: 'pap',
  },
  {
    id: 'needymeds-generic',
    programName: 'NeedyMeds Drug Discount Card',
    manufacturer: 'NeedyMeds (nonprofit)',
    drugsCovered: ['Generic ACEi', 'Generic ARBs', 'Spironolactone', 'Generic beta-blockers'],
    eligibilityCriteria: ['No eligibility requirements', 'Free to use'],
    estimatedSavings: 'Up to 80% off retail price',
    programType: 'pharmacy_discount',
  },
  {
    id: 'goodrx-discount',
    programName: 'GoodRx Prescription Discount',
    manufacturer: 'GoodRx',
    drugsCovered: ['Enalapril', 'Lisinopril', 'Losartan', 'Spironolactone', 'Carvedilol', 'Metoprolol'],
    eligibilityCriteria: ['No eligibility requirements', 'Free to use'],
    estimatedSavings: 'Varies by pharmacy; generics often $4-15/month',
    programType: 'pharmacy_discount',
  },
] as const

export function findProgramsForDrug(
  drugName: string,
): ReadonlyArray<AssistanceProgram> {
  const lowerDrug = drugName.toLowerCase()
  return ASSISTANCE_PROGRAMS.filter((program) =>
    program.drugsCovered.some((covered) =>
      covered.toLowerCase().includes(lowerDrug) ||
      lowerDrug.includes(covered.toLowerCase()),
    ),
  )
}

export function findProgramsByType(
  programType: AssistanceProgram['programType'],
): ReadonlyArray<AssistanceProgram> {
  return ASSISTANCE_PROGRAMS.filter((p) => p.programType === programType)
}
