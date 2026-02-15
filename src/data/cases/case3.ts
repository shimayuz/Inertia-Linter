import type { PatientSnapshot } from '../../types/patient.ts'

/** Case 3: 72M HFrEF EF 25% — multiple real blockers (BP_LOW, K_HIGH) -> GDMT 41/100 */
export const case3Patient: PatientSnapshot = {
  ef: 25,
  nyhaClass: 3,
  sbp: 92,
  hr: 72,
  vitalsDate: '2026-02-14',
  egfr: 28,
  potassium: 5.3,
  labsDate: '2026-02-14',
  bnp: 1200,
  dmType: 'none',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    {
      pillar: 'BETA_BLOCKER',
      name: 'Carvedilol 6.25mg',
      doseTier: 'LOW',
    },
    {
      pillar: 'MRA',
      name: 'Spironolactone 12.5mg',
      doseTier: 'LOW',
    },
    {
      pillar: 'SGLT2i',
      name: 'Dapagliflozin 10mg',
      doseTier: 'HIGH',
    },
  ],
}
