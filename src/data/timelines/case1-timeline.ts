import type { PatientSnapshot } from '../../types/patient.ts'
import type { ClinicalEvent, TimelineEntry, PatientTimeline } from '../../types/timeline.ts'
import { runAudit } from '../../engine/audit.ts'
import { case1Patient } from '../cases/case1.ts'

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
  ef: 30,
  nyhaClass: 2,
  sbp: 125,
  hr: 75,
  vitalsDate: '2025-11-15',
  egfr: 58,
  potassium: 4.0,
  labsDate: '2025-11-15',
  bnp: 520,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'BETA_BLOCKER', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry2Snapshot: PatientSnapshot = {
  ef: 30,
  nyhaClass: 2,
  sbp: 120,
  hr: 72,
  vitalsDate: '2025-12-01',
  egfr: 56,
  potassium: 4.1,
  labsDate: '2025-11-28',
  bnp: 480,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Enalapril 2.5mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry3Snapshot: PatientSnapshot = {
  ef: 30,
  nyhaClass: 2,
  sbp: 115,
  hr: 70,
  vitalsDate: '2025-12-15',
  egfr: 55,
  potassium: 4.2,
  labsDate: '2025-12-10',
  bnp: 460,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Enalapril 5mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 6.25mg', doseTier: 'LOW' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry4Snapshot: PatientSnapshot = {
  ef: 30,
  nyhaClass: 2,
  sbp: 112,
  hr: 65,
  vitalsDate: '2026-01-05',
  egfr: 55,
  potassium: 4.3,
  labsDate: '2026-01-03',
  bnp: 440,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Enalapril 5mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 12.5mg', doseTier: 'MEDIUM' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry5Snapshot: PatientSnapshot = {
  ef: 30,
  nyhaClass: 2,
  sbp: 118,
  hr: 68,
  vitalsDate: '2026-01-20',
  egfr: 54,
  potassium: 4.2,
  labsDate: '2026-01-18',
  bnp: 450,
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Enalapril 5mg', doseTier: 'LOW' },
    { pillar: 'BETA_BLOCKER', name: 'Carvedilol 12.5mg', doseTier: 'MEDIUM' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    {
      pillar: 'SGLT2i',
      name: '',
      doseTier: 'NOT_PRESCRIBED',
      hasADR: true,
      adrDescription: 'Recurrent UTIs',
    },
  ],
}

const entry1Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-11-15',
    type: 'visit',
    description: 'Initial HF diagnosis, EF 30% on echocardiogram',
  },
  {
    date: '2025-11-15',
    type: 'lab',
    description: 'Baseline labs: eGFR 58, K+ 4.0, BNP 520',
  },
]

const entry2Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-01',
    type: 'med_start',
    description: 'Enalapril 2.5mg BID started',
    pillar: 'ARNI_ACEi_ARB',
  },
  {
    date: '2025-12-01',
    type: 'visit',
    description: 'Follow-up visit, tolerating ACEi well',
  },
]

const entry3Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-15',
    type: 'med_change',
    description: 'Enalapril uptitrated 2.5mg to 5mg BID',
    pillar: 'ARNI_ACEi_ARB',
  },
  {
    date: '2025-12-15',
    type: 'med_start',
    description: 'Carvedilol 6.25mg BID started',
    pillar: 'BETA_BLOCKER',
  },
  {
    date: '2025-12-10',
    type: 'lab',
    description: 'Labs: eGFR 55, K+ 4.2 — stable renal function',
  },
]

const entry4Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-05',
    type: 'med_change',
    description: 'Carvedilol uptitrated 6.25mg to 12.5mg BID',
    pillar: 'BETA_BLOCKER',
  },
  {
    date: '2026-01-03',
    type: 'lab',
    description: 'Labs: eGFR 55, K+ 4.3, BNP 440 — slight improvement',
  },
]

const entry5Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-20',
    type: 'visit',
    description: 'UTI episode documented; SGLT2i deferred due to recurrent UTI concern',
  },
  {
    date: '2026-01-18',
    type: 'lab',
    description: 'Labs: eGFR 54, K+ 4.2, BNP 450',
  },
]

const entry6Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-02-14',
    type: 'visit',
    description: 'Follow-up visit — no medication changes, MRA and SGLT2i still not initiated',
  },
  {
    date: '2026-02-14',
    type: 'lab',
    description: 'Labs: eGFR 55, K+ 4.2, BNP 450',
  },
]

export const case1Timeline: PatientTimeline = {
  patientId: 'case-1',
  label: 'Case 1: 68M HFrEF EF 30% — Clinical Inertia Unfolding',
  entries: [
    buildEntry('2025-11-15', entry1Snapshot, entry1Events),
    buildEntry('2025-12-01', entry2Snapshot, entry2Events),
    buildEntry('2025-12-15', entry3Snapshot, entry3Events),
    buildEntry('2026-01-05', entry4Snapshot, entry4Events),
    buildEntry('2026-01-20', entry5Snapshot, entry5Events),
    buildEntry('2026-02-14', case1Patient, entry6Events),
  ],
}
