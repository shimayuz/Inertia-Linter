import type { PatientSnapshot } from '../../types/patient.ts'

/** Case 2: 75F HFpEF EF 58% — multi-guideline differences (AHA vs ESC) + finerenone opportunity */
export const case2Patient: PatientSnapshot = {
  ef: 58,
  nyhaClass: 2,
  sbp: 142,
  hr: 68,
  vitalsDate: '2026-02-10',
  egfr: 45,
  potassium: 4.8,
  labsDate: '2026-02-08',
  bnp: 220,
  dmType: 'type2',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Valsartan 80mg', doseTier: 'MEDIUM' },
    {
      pillar: 'BETA_BLOCKER',
      name: '',
      doseTier: 'NOT_PRESCRIBED',
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
    },
  ],
}
