import type { AppointmentPatient } from '../types/appointment.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { PatientTimeline } from '../types/timeline.ts'
import { case1Patient } from './cases/case1.ts'
import { case2Patient } from './cases/case2.ts'
import { case3Patient } from './cases/case3.ts'
import { case4Patient } from './cases/case4.ts'
import { case1Timeline } from './timelines/case1-timeline.ts'
import { case2Timeline } from './timelines/case2-timeline.ts'
import { case3Timeline } from './timelines/case3-timeline.ts'
import { case4Timeline } from './timelines/case4-timeline.ts'
import { listPatients } from '../fhir/fhir-client.ts'

// ---------------------------------------------------------------------------
// Demo case appointments (immutable)
// ---------------------------------------------------------------------------

const DEMO_APPOINTMENTS: ReadonlyArray<AppointmentPatient> = [
  {
    id: 'demo-case-1',
    name: 'Akiko Sato',
    age: 52,
    gender: 'Female',
    condition: 'Type 2 DM (HbA1c 8.5%)',
    source: 'demo',
    appointmentTime: '09:00',
  },
  {
    id: 'demo-case-2',
    name: 'Taro Kobayashi',
    age: 58,
    gender: 'Male',
    condition: 'HTN Stage 2 (BP 162/98)',
    source: 'demo',
    appointmentTime: '10:30',
  },
  {
    id: 'demo-case-3',
    name: 'Kenji Yamamoto',
    age: 72,
    gender: 'Male',
    condition: 'HFrEF (EF 25%)',
    source: 'demo',
    appointmentTime: '11:00',
  },
  {
    id: 'demo-case-4',
    name: 'Sachiko Watanabe',
    age: 82,
    gender: 'Female',
    condition: 'HFrEF (EF 35%) post-discharge',
    source: 'demo',
    appointmentTime: '14:00',
  },
] as const

// ---------------------------------------------------------------------------
// Demo case data lookup (immutable maps)
// ---------------------------------------------------------------------------

interface DemoCaseData {
  readonly snapshot: PatientSnapshot
  readonly timeline: PatientTimeline
}

const DEMO_CASE_DATA: Readonly<Record<string, DemoCaseData>> = {
  'demo-case-1': {
    snapshot: case1Patient,
    timeline: case1Timeline,
  },
  'demo-case-2': {
    snapshot: case2Patient,
    timeline: case2Timeline,
  },
  'demo-case-3': {
    snapshot: case3Patient,
    timeline: case3Timeline,
  },
  'demo-case-4': {
    snapshot: case4Patient,
    timeline: case4Timeline,
  },
} as const

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns demo case appointments only.
 * Pure function returning an immutable array.
 */
export function getDemoAppointments(): ReadonlyArray<AppointmentPatient> {
  return DEMO_APPOINTMENTS
}

/**
 * Returns FHIR EHR patient appointments.
 * Simulates fetching from an EHR system.
 * Pure function returning a new immutable array on each call.
 */
export function getEhrAppointments(): ReadonlyArray<AppointmentPatient> {
  const fhirPatients = listPatients()

  return fhirPatients.map(
    (patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      condition: patient.condition,
      source: 'fhir' as const,
    }),
  )
}

/**
 * Returns the full appointment list: 4 demo cases + FHIR patients.
 * Pure function returning a new immutable array on each call.
 */
export function getAppointmentList(): ReadonlyArray<AppointmentPatient> {
  return [...DEMO_APPOINTMENTS, ...getEhrAppointments()]
}

/**
 * Returns the snapshot and timeline for a demo case ID.
 * Returns undefined if the ID is not a recognized demo case.
 *
 * Pure function — no side effects.
 */
export function getDemoCaseData(
  id: string,
): DemoCaseData | undefined {
  return DEMO_CASE_DATA[id]
}
