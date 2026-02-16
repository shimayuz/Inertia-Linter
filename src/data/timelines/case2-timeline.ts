import type { PatientSnapshot } from '../../types/patient.ts'
import type { ClinicalEvent, TimelineEntry, PatientTimeline } from '../../types/timeline.ts'
import { runHTNAudit } from '../../domains/htn-control/engine.ts'
import { case2Patient } from '../cases/case2.ts'

function buildEntry(
  date: string,
  snapshot: PatientSnapshot,
  events: ReadonlyArray<ClinicalEvent>,
): TimelineEntry {
  return {
    date,
    snapshot,
    auditResult: runHTNAudit(snapshot),
    events,
  }
}

const entry1Snapshot: PatientSnapshot = {
  domainId: 'htn-control',
  ef: 55,
  nyhaClass: 1,
  sbp: 170,
  hr: 78,
  dbp: 100,
  vitalsDate: '2025-11-05',
  egfr: 54,
  potassium: 4.0,
  labsDate: '2025-11-05',
  dmType: 'type2',
  hba1c: 7.0,
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

const entry2Snapshot: PatientSnapshot = {
  domainId: 'htn-control',
  ef: 55,
  nyhaClass: 1,
  sbp: 158,
  hr: 77,
  dbp: 95,
  vitalsDate: '2025-12-10',
  egfr: 53,
  potassium: 4.1,
  labsDate: '2025-12-08',
  dmType: 'type2',
  hba1c: 6.9,
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

const entry3Snapshot: PatientSnapshot = {
  domainId: 'htn-control',
  ef: 55,
  nyhaClass: 1,
  sbp: 160,
  hr: 76,
  dbp: 96,
  vitalsDate: '2026-01-15',
  egfr: 52,
  potassium: 4.2,
  labsDate: '2026-01-12',
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

const entry1Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-11-05',
    type: 'visit',
    description: 'HTN Stage 2 diagnosed — SBP 170/100, Type 2 DM with CKD. Amlodipine 5mg started.',
  },
  {
    date: '2025-11-05',
    type: 'lab',
    description: 'Baseline labs: eGFR 54, K+ 4.0, HbA1c 7.0',
  },
]

const entry2Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-10',
    type: 'visit',
    description: 'Follow-up — SBP 158/95, some improvement but not at goal. No medication intensification.',
  },
  {
    date: '2025-12-08',
    type: 'lab',
    description: 'Labs: eGFR 53, K+ 4.1, HbA1c 6.9',
  },
]

const entry3Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-15',
    type: 'visit',
    description: 'Follow-up — SBP 160/96, ACEi discussed but not started due to "borderline K+" (4.2, well within normal). No real barrier identified.',
  },
  {
    date: '2026-01-12',
    type: 'lab',
    description: 'Labs: eGFR 52, K+ 4.2 (normal)',
  },
]

const entry4Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-02-10',
    type: 'visit',
    description: 'Follow-up — SBP 162/98, 3 months of uncontrolled Stage 2 HTN on monotherapy. ACEi/ARB and thiazide still not started. Clinical inertia.',
  },
  {
    date: '2026-02-08',
    type: 'lab',
    description: 'Labs: eGFR 52, K+ 4.1, HbA1c 6.8',
  },
]

export const case2Timeline: PatientTimeline = {
  patientId: 'case-2',
  label: 'Case 2: 58M Uncontrolled HTN \u2014 Stage 2 on Monotherapy, Clinical Inertia',
  entries: [
    buildEntry('2025-11-05', entry1Snapshot, entry1Events),
    buildEntry('2025-12-10', entry2Snapshot, entry2Events),
    buildEntry('2026-01-15', entry3Snapshot, entry3Events),
    buildEntry('2026-02-10', case2Patient, entry4Events),
  ],
}
