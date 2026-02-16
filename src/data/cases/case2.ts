import type { PatientSnapshot } from '../../types/patient.ts'

/** Case 2: 58M Uncontrolled HTN — SBP 162/98, on CCB only, ACEi/ARB and thiazide not started */
export const case2Patient: PatientSnapshot = {
  domainId: 'htn-control',
  ef: 55,
  nyhaClass: 1,
  sbp: 162,
  hr: 76,
  dbp: 98,
  vitalsDate: '2026-02-10',
  egfr: 52,
  potassium: 4.1,
  labsDate: '2026-02-08',
  dmType: 'type2',
  hba1c: 6.8,
  bmi: 29,
  ckd: true,
  htnStage: 'stage2',
  targetSBP: 130,
  targetDBP: 80,
  medications: [
    { pillar: 'ACEi_ARB_HTN', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'CCB', name: 'Amlodipine 5mg', doseTier: 'MEDIUM' },
    { pillar: 'THIAZIDE', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'BETA_BLOCKER_HTN', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}
