import type { PatientSnapshot } from '../../types/patient.ts'

/** Case 1: 68M HFrEF EF 30% — clinical inertia + UTI barrier for SGLT2i -> GDMT 24/100 */
export const case1Patient: PatientSnapshot = {
  ef: 30,
  nyhaClass: 2,
  sbp: 118,
  hr: 68,
  vitalsDate: '2026-02-14',
  egfr: 55,
  potassium: 4.2,
  labsDate: '2026-02-14',
  bnp: 450,
  medications: [
    {
      pillar: 'ARNI_ACEi_ARB',
      name: 'Enalapril 5mg',
      doseTier: 'LOW',
    },
    {
      pillar: 'BETA_BLOCKER',
      name: 'Carvedilol 12.5mg',
      doseTier: 'MEDIUM',
    },
    {
      pillar: 'MRA',
      name: '',
      doseTier: 'NOT_PRESCRIBED',
    },
    {
      pillar: 'SGLT2i',
      name: '',
      doseTier: 'NOT_PRESCRIBED',
      hasADR: true,
      adrDescription: 'Recurrent UTIs',
    },
  ],
}
