import type { PatientResolutionContext, PriorDrugTrial } from '../../types/resolution.ts'

export const case4PriorTrials: ReadonlyArray<PriorDrugTrial> = [
  {
    drugName: 'Sacubitril/Valsartan 24/26mg',
    pillar: 'ARNI_ACEi_ARB',
    startDate: '2025-12-22',
    endDate: '2026-01-05',
    durationDays: 14,
    outcome: 'tolerated',
    reasonStopped: 'PA denied at discharge; step therapy required by payer',
  },
  {
    drugName: 'Eplerenone 25mg',
    pillar: 'MRA',
    startDate: '2025-12-22',
    endDate: '2026-01-05',
    durationDays: 14,
    outcome: 'tolerated',
    reasonStopped: 'Copay $85/month; patient unable to afford post-discharge',
  },
  {
    drugName: 'Dapagliflozin 10mg',
    pillar: 'SGLT2i',
    startDate: '2025-12-22',
    durationDays: 55,
    outcome: 'tolerated',
  },
  {
    drugName: 'Carvedilol 6.25mg',
    pillar: 'BETA_BLOCKER',
    startDate: '2025-12-22',
    durationDays: 55,
    outcome: 'tolerated',
  },
] as const

export const case4ResolutionContext: PatientResolutionContext = {
  insurance: {
    payerName: 'BlueCross BlueShield of Illinois',
    planType: 'commercial',
    memberId: 'BCB-4482-7731',
    groupNumber: 'GRP-882',
    pharmacyBenefitPhone: '1-800-555-0199',
  },
  prescriber: {
    npi: '1234567890',
    name: 'Dr. James Chen',
    specialty: 'Cardiology',
    phone: '312-555-0142',
    fax: '312-555-0143',
  },
  priorTrials: case4PriorTrials,
  activeResolutions: [],
} as const
