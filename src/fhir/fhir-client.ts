import type { FHIRBundle } from './types.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FHIRPatientSummary {
  readonly id: string
  readonly name: string
  readonly age: number
  readonly gender: string
  readonly condition: string
}

// ---------------------------------------------------------------------------
// Patient registry (immutable)
// ---------------------------------------------------------------------------

const PATIENT_SUMMARIES: ReadonlyArray<FHIRPatientSummary> = [
  {
    id: 'demo-001',
    name: 'Hiroshi Tanaka',
    age: 68,
    gender: 'Male',
    condition: 'HFrEF (EF 30%)',
  },
  {
    id: 'demo-002',
    name: 'Yoko Suzuki',
    age: 75,
    gender: 'Female',
    condition: 'HFpEF (EF 58%) + DM2',
  },
  {
    id: 'demo-003',
    name: 'Kenji Yamamoto',
    age: 72,
    gender: 'Male',
    condition: 'HFrEF (EF 25%)',
  },
] as const

const PATIENT_ID_TO_FILE: Readonly<Record<string, string>> = {
  'demo-001': 'patient-001',
  'demo-002': 'patient-002',
  'demo-003': 'patient-003',
} as const

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the list of available mock patients.
 * Pure function returning an immutable array.
 */
export function listPatients(): ReadonlyArray<FHIRPatientSummary> {
  return PATIENT_SUMMARIES
}

/**
 * Fetch the full FHIR Bundle for a given patient ID.
 * Uses dynamic import to load the corresponding JSON mock bundle.
 *
 * @throws Error if the patient ID is not recognized
 */
export async function fetchPatientEverything(
  patientId: string,
): Promise<FHIRBundle> {
  const fileName = PATIENT_ID_TO_FILE[patientId]

  if (fileName === undefined) {
    throw new Error(
      `Unknown patient ID: "${patientId}". Valid IDs: ${Object.keys(PATIENT_ID_TO_FILE).join(', ')}`,
    )
  }

  const module = await import(`./mock-bundles/${fileName}.json`)
  return module.default as FHIRBundle
}
