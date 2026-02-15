import { useTranslation } from 'react-i18next'
import type { FHIRPatientSummary } from '../fhir/fhir-client.ts'

interface FHIRPatientListProps {
  readonly isOpen: boolean
  readonly patients: ReadonlyArray<FHIRPatientSummary>
  readonly isLoading: boolean
  readonly error: string | null
  readonly selectedPatientId: string | null
  readonly onSelect: (patientId: string) => void
  readonly onClose: () => void
}

function PatientRow({
  patient,
  isSelected,
  isLoading,
  onSelect,
}: {
  readonly patient: FHIRPatientSummary
  readonly isSelected: boolean
  readonly isLoading: boolean
  readonly onSelect: (patientId: string) => void
}) {
  const baseClasses =
    'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors cursor-pointer'
  const selectedClasses = isSelected
    ? 'border-blue-300 bg-blue-50'
    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'

  return (
    <button
      type="button"
      className={`${baseClasses} ${selectedClasses}`}
      onClick={() => onSelect(patient.id)}
      disabled={isLoading}
    >
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-medium text-gray-800">
          {patient.name}
        </span>
        <span className="text-xs text-gray-500">
          {String(patient.age)}y / {patient.gender}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
          {patient.condition}
        </span>
        {isSelected && isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Loading patient data"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
      </div>
    </button>
  )
}

export function FHIRPatientList({
  isOpen,
  patients,
  isLoading,
  error,
  selectedPatientId,
  onSelect,
  onClose,
}: FHIRPatientListProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fhir-patient-list-title"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <h2
              id="fhir-patient-list-title"
              className="text-base font-semibold text-gray-800"
            >
              {t('ehr.patientList')}
            </h2>
            <span className="text-xs text-gray-400">
              {t('ehr.mockServer')}
            </span>
          </div>
          <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-600">
            FHIR R4
          </span>
        </div>

        {/* Patient list */}
        <div className="flex flex-col gap-2 px-6 py-4">
          {patients.map((patient) => (
            <PatientRow
              key={patient.id}
              patient={patient}
              isSelected={selectedPatientId === patient.id}
              isLoading={isLoading}
              onSelect={onSelect}
            />
          ))}

          {patients.length === 0 && !error && (
            <p className="py-4 text-center text-sm text-gray-400">
              {t('ehr.noPatients')}
            </p>
          )}
        </div>

        {/* Error display */}
        {error !== null && (
          <div className="mx-6 mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            {t('ehr.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
