import { useTranslation } from 'react-i18next'
import type { AppointmentPatient } from '../types/appointment.ts'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PatientListSidebarProps {
  readonly appointments: ReadonlyArray<AppointmentPatient>
  readonly selectedId: string | null
  readonly isLoading: boolean
  readonly onSelectPatient: (id: string) => void
  readonly onManualEntry: () => void
  readonly onImageUpload: () => void
  readonly isEhrConnected: boolean
  readonly isEhrConnecting: boolean
  readonly onConnectEhr: () => void
}

// ---------------------------------------------------------------------------
// Loading spinner (inline SVG to avoid external dependency)
// ---------------------------------------------------------------------------

function LoadingSpinner({ label }: { readonly label: string }) {
  return (
    <svg
      className="h-4 w-4 animate-spin text-teal-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-label={label}
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
  )
}

// ---------------------------------------------------------------------------
// Source badge
// ---------------------------------------------------------------------------

function SourceBadge({ source, demoLabel, ehrLabel }: { readonly source: 'demo' | 'fhir' | 'manual'; readonly demoLabel: string; readonly ehrLabel: string }) {
  if (source === 'demo') {
    return (
      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
        {demoLabel}
      </span>
    )
  }

  if (source === 'fhir') {
    return (
      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
        {ehrLabel}
      </span>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Patient row
// ---------------------------------------------------------------------------

function PatientRow({
  patient,
  isSelected,
  isLoading,
  onSelect,
  demoLabel,
  ehrLabel,
  loadingLabel,
}: {
  readonly patient: AppointmentPatient
  readonly isSelected: boolean
  readonly isLoading: boolean
  readonly onSelect: (id: string) => void
  readonly demoLabel: string
  readonly ehrLabel: string
  readonly loadingLabel: string
}) {
  const baseClasses =
    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 transition-colors cursor-pointer text-left'
  const selectedClasses = isSelected
    ? 'border-l-2 border-teal-500 bg-teal-50'
    : 'border-gray-200 bg-white hover:bg-gray-50'

  return (
    <button
      type="button"
      className={`${baseClasses} ${selectedClasses}`}
      onClick={() => onSelect(patient.id)}
      disabled={isSelected && isLoading}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {patient.appointmentTime !== undefined && (
          <span className="shrink-0 text-xs font-medium text-gray-400 tabular-nums">
            {patient.appointmentTime}
          </span>
        )}
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-gray-800 truncate">
            {patient.name}
          </span>
          <span className="text-xs text-gray-500">
            {String(patient.age)}y / {patient.gender}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
          {patient.condition}
        </span>
        <SourceBadge source={patient.source} demoLabel={demoLabel} ehrLabel={ehrLabel} />
        {isSelected && isLoading && <LoadingSpinner label={loadingLabel} />}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  label,
  accentColor,
}: {
  readonly label: string
  readonly accentColor: 'teal' | 'blue'
}) {
  const dotColor = accentColor === 'teal' ? 'bg-teal-400' : 'bg-blue-400'

  return (
    <div className="flex items-center gap-2 px-1 pb-1 pt-3">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EHR Connect icon (inline SVG)
// ---------------------------------------------------------------------------

function EhrConnectIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Camera / upload icon (inline SVG)
// ---------------------------------------------------------------------------

function CameraIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PatientListSidebar({
  appointments,
  selectedId,
  isLoading,
  onSelectPatient,
  onManualEntry,
  onImageUpload,
  isEhrConnected,
  isEhrConnecting,
  onConnectEhr,
}: PatientListSidebarProps) {
  const { t } = useTranslation()

  const demoCases = appointments.filter((p) => p.source === 'demo')
  const ehrPatients = appointments.filter((p) => p.source === 'fhir')

  const demoLabel = t('sidebar.badgeDemo')
  const ehrLabel = t('sidebar.badgeEhr')
  const loadingLabel = t('sidebar.loadingPatient')

  return (
    <aside className="flex h-full flex-col bg-white font-[Lato,sans-serif]">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-gray-800">
            {t('sidebar.todayPatients')}
          </h2>
          <span className="text-[11px] text-gray-400">
            {t('sidebar.patientCount', { count: appointments.length })}
          </span>
        </div>
        {isEhrConnected && (
          <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-600">
            FHIR R4
          </span>
        )}
      </div>

      {/* ---- Scrollable patient list ---- */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {/* Demo Cases section */}
        {demoCases.length > 0 && (
          <>
            <SectionHeader label={t('sidebar.demoCases')} accentColor="teal" />
            <div className="flex flex-col gap-1.5">
              {demoCases.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  isSelected={selectedId === patient.id}
                  isLoading={isLoading}
                  onSelect={onSelectPatient}
                  demoLabel={demoLabel}
                  ehrLabel={ehrLabel}
                  loadingLabel={loadingLabel}
                />
              ))}
            </div>
          </>
        )}

        {/* EHR section */}
        <SectionHeader label={t('sidebar.ehrPatients')} accentColor="blue" />

        {isEhrConnected ? (
          <>
            {/* Connected: show patient list */}
            <div className="flex items-center gap-1.5 px-1 pb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-600 font-medium">
                {t('ehr.connected')}
              </span>
            </div>
            {ehrPatients.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {ehrPatients.map((patient) => (
                  <PatientRow
                    key={patient.id}
                    patient={patient}
                    isSelected={selectedId === patient.id}
                    isLoading={isLoading}
                    onSelect={onSelectPatient}
                    demoLabel={demoLabel}
                    ehrLabel={ehrLabel}
                    loadingLabel={loadingLabel}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3">
                {t('ehr.noPatients')}
              </p>
            )}
          </>
        ) : (
          /* Not connected: show connect button */
          <div className="flex flex-col items-center gap-2 py-4">
            <button
              type="button"
              onClick={onConnectEhr}
              disabled={isEhrConnecting}
              className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-medium transition-colors ${
                isEhrConnecting
                  ? 'border-teal-300 bg-teal-50/70 text-teal-500 cursor-wait'
                  : 'border-teal-200 bg-teal-50/40 text-teal-700 hover:border-teal-300 hover:bg-teal-50/70'
              }`}
            >
              {isEhrConnecting ? (
                <LoadingSpinner label={t('ehr.connecting')} />
              ) : (
                <EhrConnectIcon />
              )}
              {isEhrConnecting ? t('ehr.connecting') : t('ehr.connect')}
            </button>
            <span className="text-[10px] text-gray-400">
              {t('ehr.connectDesc')}
            </span>
          </div>
        )}
      </div>

      {/* ---- Footer ---- */}
      <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={onManualEntry}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {t('sidebar.manualEntry')}
        </button>
        <button
          type="button"
          onClick={onImageUpload}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50"
          aria-label={t('sidebar.uploadImage')}
        >
          <CameraIcon />
        </button>
      </div>
    </aside>
  )
}
