import type { PatientSnapshot } from '../../types/patient.ts'
import type { ClinicalEvent, TimelineEntry, PatientTimeline } from '../../types/timeline.ts'
import { runDMAudit } from '../../domains/dm-mgmt/engine.ts'
import { case1Patient } from '../cases/case1.ts'

function buildEntry(
  date: string,
  snapshot: PatientSnapshot,
  events: ReadonlyArray<ClinicalEvent>,
): TimelineEntry {
  return {
    date,
    snapshot,
    auditResult: runDMAudit(snapshot),
    events,
  }
}

// ---------------------------------------------------------------------------
// Timeline snapshots: 52F Type 2 DM -- gradual HbA1c rise, missed intensification
// ---------------------------------------------------------------------------

const entry1Snapshot: PatientSnapshot = {
  domainId: 'dm-mgmt',
  ef: 60,
  nyhaClass: 1,
  sbp: 130,
  hr: 76,
  dbp: 84,
  vitalsDate: '2025-11-01',
  egfr: 68,
  potassium: 4.2,
  labsDate: '2025-11-01',
  dmType: 'type2',
  hba1c: 7.2,
  fastingGlucose: 142,
  bmi: 31,
  cvdRisk: true,
  ckd: false,
  medications: [
    { pillar: 'METFORMIN', name: 'Metformin 500mg daily', doseTier: 'LOW' },
    { pillar: 'SGLT2i_DM', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'GLP1_RA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'INSULIN', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry2Snapshot: PatientSnapshot = {
  domainId: 'dm-mgmt',
  ef: 60,
  nyhaClass: 1,
  sbp: 132,
  hr: 74,
  dbp: 82,
  vitalsDate: '2025-12-05',
  egfr: 67,
  potassium: 4.3,
  labsDate: '2025-12-03',
  dmType: 'type2',
  hba1c: 7.5,
  fastingGlucose: 155,
  bmi: 31.5,
  cvdRisk: true,
  ckd: false,
  medications: [
    { pillar: 'METFORMIN', name: 'Metformin 1000mg BID', doseTier: 'MEDIUM' },
    { pillar: 'SGLT2i_DM', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'GLP1_RA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'INSULIN', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

const entry3Snapshot: PatientSnapshot = {
  domainId: 'dm-mgmt',
  ef: 60,
  nyhaClass: 1,
  sbp: 130,
  hr: 76,
  dbp: 80,
  vitalsDate: '2026-01-10',
  egfr: 66,
  potassium: 4.2,
  labsDate: '2026-01-08',
  dmType: 'type2',
  hba1c: 8.0,
  fastingGlucose: 168,
  bmi: 32,
  cvdRisk: true,
  ckd: false,
  medications: [
    { pillar: 'METFORMIN', name: 'Metformin 1000mg BID', doseTier: 'MEDIUM' },
    { pillar: 'SGLT2i_DM', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'GLP1_RA', name: '', doseTier: 'NOT_PRESCRIBED' },
    { pillar: 'INSULIN', name: '', doseTier: 'NOT_PRESCRIBED' },
  ],
}

// ---------------------------------------------------------------------------
// Timeline events
// ---------------------------------------------------------------------------

const entry1Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-11-01',
    type: 'visit',
    description: 'Type 2 DM diagnosis, HbA1c 7.2%, BMI 31',
  },
  {
    date: '2025-11-01',
    type: 'med_start',
    description: 'Metformin 500mg daily started',
    pillar: 'METFORMIN',
  },
  {
    date: '2025-11-01',
    type: 'lab',
    description: 'Baseline labs: HbA1c 7.2%, eGFR 68, K+ 4.2, fasting glucose 142',
  },
]

const entry2Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2025-12-05',
    type: 'visit',
    description: 'Follow-up visit, HbA1c rising to 7.5%, tolerating metformin',
  },
  {
    date: '2025-12-05',
    type: 'med_change',
    description: 'Metformin uptitrated 500mg daily to 1000mg BID',
    pillar: 'METFORMIN',
  },
  {
    date: '2025-12-03',
    type: 'lab',
    description: 'Labs: HbA1c 7.5%, eGFR 67, K+ 4.3, fasting glucose 155',
  },
]

const entry3Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-01-10',
    type: 'visit',
    description: 'Follow-up visit, HbA1c 8.0% despite metformin uptitration. SGLT2i discussed but not started',
  },
  {
    date: '2026-01-08',
    type: 'lab',
    description: 'Labs: HbA1c 8.0%, eGFR 66, K+ 4.2, fasting glucose 168',
  },
]

const entry4Events: ReadonlyArray<ClinicalEvent> = [
  {
    date: '2026-02-14',
    type: 'visit',
    description: 'Follow-up visit -- HbA1c 8.5%, still only on Metformin 500mg BID (dose reduced from 1000mg). No SGLT2i or GLP-1 RA initiated',
  },
  {
    date: '2026-02-14',
    type: 'lab',
    description: 'Labs: HbA1c 8.5%, eGFR 65, K+ 4.3, fasting glucose 185',
  },
]

// ---------------------------------------------------------------------------
// Assembled timeline
// ---------------------------------------------------------------------------

export const case1Timeline: PatientTimeline = {
  patientId: 'case-1',
  label: 'Case 1: 52F Type 2 DM -- Clinical Inertia in Glucose Management',
  entries: [
    buildEntry('2025-11-01', entry1Snapshot, entry1Events),
    buildEntry('2025-12-05', entry2Snapshot, entry2Events),
    buildEntry('2026-01-10', entry3Snapshot, entry3Events),
    buildEntry('2026-02-14', case1Patient, entry4Events),
  ],
}
