import type { PatientSnapshot } from '../../types/patient.ts'
import type { ClinicalEvent, TimelineEntry, PatientTimeline } from '../../types/timeline.ts'
import { runAudit } from '../../engine/audit.ts'
import { case3Patient } from '../cases/case3.ts'

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

const entry1Snapshot: PatientSnapshot = {
  ef: 25,
  nyhaClass: 3,
  sbp: 88,
  hr: 78,
  vitalsDate: '2025-11-20',
  egfr: 25,
  potassium: 5.5,
  labsDate: '2025-11-20',
  bnp: 1800,
  dmType: 'none',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 3.125mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry2Snapshot: PatientSnapshot = {
  ef: 25,
  nyhaClass: 3,
  sbp: 90,
  hr: 75,
  vitalsDate: '2025-12-05',
  egfr: 27,
  potassium: 5.2,
  labsDate: '2025-12-03',
  bnp: 1600,
  dmType: 'none',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 3.125mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: 'Dapagliflozin 10mg', doseTier: 'HIGH' },
  ],
}

const entry3Snapshot: PatientSnapshot = {
  ef: 25,
  nyhaClass: 3,
  sbp: 90,
  hr: 74,
  vitalsDate: '2025-12-20',
  egfr: 28,
  potassium: 5.0,
  labsDate: '2025-12-18',
  bnp: 1500,
  dmType: 'none',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 3.125mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: 'Spironolactone 12.5mg', doseTier: 'LOW' },
    { pillar: 'SGLT2i', name: 'Dapagliflozin 10mg', doseTier: 'HIGH' },
  ],
}

const entry4Snapshot: PatientSnapshot = {
  ef: 25,
  nyhaClass: 3,
  sbp: 92,
  hr: 70,
  vitalsDate: '2026-01-10',
  egfr: 28,
  potassium: 4.9,
  labsDate: '2026-01-08',
  bnp: 1400,
  dmType: 'none',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 6.25mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: 'Spironolactone 12.5mg', doseTier: 'LOW' },
    { pillar: 'SGLT2i', name: 'Dapagliflozin 10mg', doseTier: 'HIGH' },
  ],
}

const entry5Snapshot: PatientSnapshot = {
  ef: 25,
  nyhaClass: 3,
  sbp: 90,
  hr: 74,
  vitalsDate: '2026-01-25',
  egfr: 26,
  potassium: 5.4,
  labsDate: '2026-01-25',
  bnp: 1500,
  dmType: 'none',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Sacubitril/Valsartan 24/26mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 6.25mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: 'Spironolactone 12.5mg', doseTier: 'LOW' },
    { pillar: 'SGLT2i', name: 'Dapagliflozin 10mg', doseTier: 'HIGH' },
  ],
}

const entry1Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-11-20',
    type: 'hospitalization',
    description: 'Post-discharge from HF hospitalization — EF 25%, severe decompensation',
  },
  {
    date: '2025-11-20',
    type: 'lab',
    description: 'Discharge labs: eGFR 25, K+ 5.5, BNP 1800 — hyperkalemia and renal impairment',
  },
  {
    date: '2025-11-20',
    type: 'vitals',
    description: 'SBP 88, HR 78 — hypotension limiting uptitration',
  },
]

const entry2Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-05',
    type: 'med_start',
    description: 'Dapagliflozin 10mg daily started — SGLT2i safe to initiate at low eGFR',
    pillar: 'SGLT2i',
  },
  {
    date: '2025-12-03',
    type: 'lab',
    description: 'Labs improving: eGFR 27, K+ 5.2, BNP 1600',
  },
  {
    date: '2025-12-05',
    type: 'visit',
    description: 'Follow-up — BP still low (90), ARNI/BB uptitration deferred',
  },
]

const entry3Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-20',
    type: 'med_start',
    description: 'Spironolactone 12.5mg daily started after dietary K+ counseling',
    pillar: 'MRA',
  },
  {
    date: '2025-12-18',
    type: 'lab',
    description: 'Labs: eGFR 28, K+ 5.0 (improved with dietary changes), BNP 1500',
  },
  {
    date: '2025-12-20',
    type: 'visit',
    description: 'Follow-up — BP 90 still limiting ARNI/BB uptitration',
  },
]

const entry4Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-10',
    type: 'med_change',
    description: 'Carvedilol uptitrated 3.125mg to 6.25mg BID — tolerated with SBP 92',
    pillar: 'BETA_BLOCKER',
  },
  {
    date: '2026-01-08',
    type: 'lab',
    description: 'Labs: eGFR 28, K+ 4.9, BNP 1400 — trending down',
  },
  {
    date: '2026-01-10',
    type: 'visit',
    description: 'Follow-up — slight BP improvement, cautious BB uptitration attempted',
  },
]

const entry5Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-25',
    type: 'hospitalization',
    description: 'Brief hospitalization for volume overload — diuretics adjusted',
  },
  {
    date: '2026-01-25',
    type: 'lab',
    description: 'Labs: eGFR 26, K+ 5.4 (rose after diuretic adjustment), BNP 1500',
  },
  {
    date: '2026-01-25',
    type: 'visit',
    description: 'MRA continued at LOW dose with close monitoring of K+',
  },
]

const entry6Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-02-14',
    type: 'visit',
    description: 'Follow-up — stable on current regimen, blockers (BP_LOW, K_HIGH) persist',
  },
  {
    date: '2026-02-14',
    type: 'lab',
    description: 'Labs: eGFR 28, K+ 5.3, BNP 1200 — slow improvement despite constraints',
  },
]

export const case3Timeline: PatientTimeline = {
  patientId: 'case-3',
  label: 'Case 3: 72M HFrEF EF 25% — Real Blockers, Careful Titration',
  entries: [
    buildEntry('2025-11-20', entry1Snapshot, entry1Events),
    buildEntry('2025-12-05', entry2Snapshot, entry2Events),
    buildEntry('2025-12-20', entry3Snapshot, entry3Events),
    buildEntry('2026-01-10', entry4Snapshot, entry4Events),
    buildEntry('2026-01-25', entry5Snapshot, entry5Events),
    buildEntry('2026-02-14', case3Patient, entry6Events),
  ],
}
