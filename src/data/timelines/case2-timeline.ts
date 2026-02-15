import type { PatientSnapshot } from '../../types/patient.ts'
import type { ClinicalEvent, TimelineEntry, PatientTimeline } from '../../types/timeline.ts'
import { runAudit } from '../../engine/audit.ts'
import { case2Patient } from '../cases/case2.ts'

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
  ef: 58,
  nyhaClass: 2,
  sbp: 148,
  hr: 72,
  vitalsDate: '2025-11-10',
  egfr: 48,
  potassium: 4.5,
  labsDate: '2025-11-10',
  bnp: 180,
  dmType: 'type2',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Valsartan 80mg', doseTier: 'MEDIUM' },
    { pillar: 'BETA_BLOCKER', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry2Snapshot: PatientSnapshot = {
  ef: 58,
  nyhaClass: 2,
  sbp: 145,
  hr: 70,
  vitalsDate: '2025-12-15',
  egfr: 46,
  potassium: 4.6,
  labsDate: '2025-12-12',
  bnp: 200,
  dmType: 'type2',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Valsartan 80mg', doseTier: 'MEDIUM' },
    { pillar: 'BETA_BLOCKER', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry3Snapshot: PatientSnapshot = {
  ef: 58,
  nyhaClass: 2,
  sbp: 144,
  hr: 69,
  vitalsDate: '2026-01-20',
  egfr: 45,
  potassium: 4.9,
  labsDate: '2026-01-18',
  bnp: 210,
  dmType: 'type2',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'Valsartan 80mg', doseTier: 'MEDIUM' },
    { pillar: 'BETA_BLOCKER', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry1Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-11-10',
    type: 'visit',
    description: 'Initial HFpEF assessment — EF 58%, NYHA II, Type 2 DM on metformin',
  },
  {
    date: '2025-11-10',
    type: 'lab',
    description: 'Baseline labs: eGFR 48, K+ 4.5, BNP 180',
  },
]

const entry2Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-15',
    type: 'visit',
    description: 'Follow-up — SGLT2i discussed but not started; provider notes AHA Class 2a vs ESC Class I discrepancy',
  },
  {
    date: '2025-12-12',
    type: 'lab',
    description: 'Labs: eGFR 46, K+ 4.6, BNP 200 — slight BNP rise',
  },
]

const entry3Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-20',
    type: 'visit',
    description: 'Follow-up — labs stable, SGLT2i still not initiated despite guideline support',
  },
  {
    date: '2026-01-18',
    type: 'lab',
    description: 'Labs: eGFR 45, K+ 4.9 approaching threshold, BNP 210',
  },
]

const entry4Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-02-10',
    type: 'visit',
    description: 'Follow-up — no medication changes, guideline ambiguity (AHA vs ESC) remains central issue',
  },
  {
    date: '2026-02-08',
    type: 'lab',
    description: 'Labs: eGFR 45, K+ 4.8, BNP 220',
  },
]

export const case2Timeline: PatientTimeline = {
  patientId: 'case-2',
  label: 'Case 2: 75F HFpEF EF 58% — SGLT2i Gap, Guideline Ambiguity',
  entries: [
    buildEntry('2025-11-10', entry1Snapshot, entry1Events),
    buildEntry('2025-12-15', entry2Snapshot, entry2Events),
    buildEntry('2026-01-20', entry3Snapshot, entry3Events),
    buildEntry('2026-02-10', case2Patient, entry4Events),
  ],
}
