import { useState, useCallback } from 'react'
import { listPatients, fetchPatientEverything } from '../fhir/fhir-client.ts'
import type { FHIRPatientSummary } from '../fhir/fhir-client.ts'
import { fhirToSnapshot } from '../fhir/fhir-to-snapshot.ts'
import type { PatientSnapshot } from '../types/patient.ts'

interface FHIRConnectState {
  readonly isOpen: boolean
  readonly isLoading: boolean
  readonly error: string | null
  readonly patients: ReadonlyArray<FHIRPatientSummary>
  readonly selectedPatientId: string | null
}

const INITIAL_STATE: FHIRConnectState = {
  isOpen: false,
  isLoading: false,
  error: null,
  patients: [],
  selectedPatientId: null,
}

export function useFHIRConnect() {
  const [state, setState] = useState<FHIRConnectState>(INITIAL_STATE)

  const open = useCallback(() => {
    const patients = listPatients()
    setState((prev) => ({
      ...prev,
      isOpen: true,
      isLoading: false,
      error: null,
      patients,
      selectedPatientId: null,
    }))
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      error: null,
      selectedPatientId: null,
    }))
  }, [])

  const selectPatient = useCallback(
    async (patientId: string): Promise<PatientSnapshot | null> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        selectedPatientId: patientId,
      }))

      try {
        const bundle = await fetchPatientEverything(patientId)
        const snapshot = fhirToSnapshot(bundle)

        setState((prev) => ({
          ...prev,
          isOpen: false,
          isLoading: false,
          error: null,
          selectedPatientId: null,
        }))

        return snapshot
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load patient data'

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          selectedPatientId: null,
        }))

        return null
      }
    },
    [],
  )

  return {
    ...state,
    open,
    close,
    selectPatient,
  } as const
}
