import type { PatientSnapshot } from '../../types/patient.ts'

/** Case 1: 52F Type 2 DM -- HbA1c 8.5%, on metformin only, SGLT2i and GLP-1 RA not started */
export const case1Patient: PatientSnapshot = {
  domainId: 'dm-mgmt',
  ef: 60,
  nyhaClass: 1,
  sbp: 128,
  hr: 78,
  dbp: 82,
  vitalsDate: '2026-02-14',
  egfr: 65,
  potassium: 4.3,
  labsDate: '2026-02-14',
  dmType: 'type2',
  hba1c: 8.5,
  fastingGlucose: 185,
  bmi: 32,
  cvdRisk: true,
  ckd: false,
  medications: [
    { pillar: 'METFORMIN', name: 'Metformin 500mg BID', doseTier: 'LOW' },
    { pillar: 'SGLT2i_DM', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'GLP1_RA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'INSULIN', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}
