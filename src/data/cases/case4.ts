import type { PatientSnapshot } from '../../types/patient.ts'
import { case4ResolutionContext } from './case4-resolution.ts'

/** Case 4: 82F HFrEF EF 35% — systemic access barriers causing GDMT regression post-discharge -> GDMT ~16/100 */
export const case4Patient: PatientSnapshot = {
  ef: 35,
  nyhaClass: 3,
  sbp: 112,
  hr: 68,
  vitalsDate: '2026-02-14',
  egfr: 45,
  potassium: 4.5,
  labsDate: '2026-02-14',
  bnp: 380,
  medications: [
    {
      pillar: 'ARNI_ACEi_ARB',
      name: '',
      doseTier: 'NOT_PRESCRIBED',
      accessBarrier: {
        type: 'step_therapy',
        description: 'Payer requires 90-day ACEi trial before ARNI approval',
      },
    },
    {
      pillar: 'BETA_BLOCKER',
      name: 'Carvedilol 6.25mg',
      doseTier: 'LOW',
    },
    {
      pillar: 'MRA',
      name: '',
      doseTier: 'NOT_PRESCRIBED',
      costBarrier: true,
      accessBarrier: {
        type: 'copay_prohibitive',
        description: 'Eplerenone copay $85/month - patient unable to afford',
      },
    },
    {
      pillar: 'SGLT2i',
      name: 'Dapagliflozin 10mg',
      doseTier: 'HIGH',
    },
  ],
  resolutionContext: case4ResolutionContext,
}
