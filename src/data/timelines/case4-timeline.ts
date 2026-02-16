import type { PatientSnapshot } from '../../types/patient.ts'
import type { ClinicalEvent, PatientTimeline } from '../../types/timeline.ts'
import { runAudit } from '../../engine/audit.ts'
import { case4Patient } from '../cases/case4.ts'
import type { TimelineEntry } from '../../types/timeline.ts'

function buildEntry(
  date: string,
  snapshot: PatientSnapshot,
  events: ReadonlyArray<ClinicalEvent>,
): TimelineEntry {
  return {
    date,
    snapshot,
    auditResult: runAudit(snapshot),
    events,
  }
}

/** Entry 1: Hospitalization — good GDMT initiation, all 4 pillars started */
const entry1Snapshot: PatientSnapshot = {
  ef: 35,
  nyhaClass: 3,
  sbp: 95,
  hr: 92,
  vitalsDate: '2025-12-20',
  egfr: 38,
  potassium: 4.8,
  labsDate: '2025-12-20',
  bnp: 850,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 3.125mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: 'Eplerenone 25mg', doseTier: 'LOW' },
    { pillar: 'SGLT2i', name: 'Dapagliflozin 10mg', doseTier: 'HIGH' },
  ],
}

/** Entry 2: Discharge — all 4 medications on discharge summary */
const entry2Snapshot: PatientSnapshot = {
  ef: 35,
  nyhaClass: 3,
  sbp: 108,
  hr: 76,
  vitalsDate: '2026-01-05',
  egfr: 42,
  potassium: 4.6,
  labsDate: '2026-01-05',
  bnp: 420,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 3.125mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: 'Eplerenone 25mg', doseTier: 'LOW' },
    { pillar: 'SGLT2i', name: 'Dapagliflozin 10mg', doseTier: 'HIGH' },
  ],
}

const entry1Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-20',
    type: 'hospitalization',
    description: 'Admitted for acute decompensated heart failure, EF 35% on echocardiogram',
  },
  {
    date: '2025-12-20',
    type: 'lab',
    description: 'Admission labs: eGFR 38, K+ 4.8, BNP 850',
  },
  {
    date: '2025-12-20',
    type: 'med_start',
    description: 'Sacubitril/Valsartan 24/26mg BID started',
    pillar: 'ARNI_ACEi_ARB',
  },
  {
    date: '2025-12-20',
    type: 'med_start',
    description: 'Carvedilol 3.125mg BID started',
    pillar: 'BETA_BLOCKER',
  },
  {
    date: '2025-12-20',
    type: 'med_start',
    description: 'Eplerenone 25mg daily started',
    pillar: 'MRA',
  },
  {
    date: '2025-12-20',
    type: 'med_start',
    description: 'Dapagliflozin 10mg daily started',
    pillar: 'SGLT2i',
  },
]

const entry2Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-05',
    type: 'discharge',
    description: 'Discharge — all 4 GDMT pillars on discharge summary, transition to outpatient cardiology',
  },
  {
    date: '2026-01-05',
    type: 'lab',
    description: 'Discharge labs: eGFR 42, K+ 4.6, BNP 420',
  },
]

const entry3Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-02-14',
    type: 'visit',
    description: 'Outpatient cardiology follow-up — 6 weeks post-discharge',
  },
  {
    date: '2026-02-14',
    type: 'med_stop',
    description: 'ARNI (Sacubitril/Valsartan) lost: prior authorization denied, payer requires 90-day ACEi step therapy trial',
    pillar: 'ARNI_ACEi_ARB',
  },
  {
    date: '2026-02-14',
    type: 'med_change',
    description: 'Carvedilol uptitrated 3.125mg to 6.25mg BID — tolerating well',
    pillar: 'BETA_BLOCKER',
  },
  {
    date: '2026-02-14',
    type: 'med_stop',
    description: 'MRA (Eplerenone) lost: patient unable to fill prescription, copay $85/month prohibitive',
    pillar: 'MRA',
  },
  {
    date: '2026-02-14',
    type: 'lab',
    description: 'Labs: eGFR 45, K+ 4.5, BNP 380 — improving but 2 pillars lost to access barriers',
  },
]

export const case4Timeline: PatientTimeline = {
  patientId: 'case-4',
  label: 'Case 4: 82F HFrEF EF 35% — The System Failed Her',
  entries: [
    buildEntry('2025-12-20', entry1Snapshot, entry1Events),
    buildEntry('2026-01-05', entry2Snapshot, entry2Events),
    buildEntry('2026-02-14', case4Patient, entry3Events),
  ],
}
