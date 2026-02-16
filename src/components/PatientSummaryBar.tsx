import { useTranslation } from 'react-i18next'
import type { PatientSnapshot } from '../types/patient.ts'
import { classifyEF } from '../engine/classify-ef.ts'

interface PatientSummaryBarProps {
  readonly patient: PatientSnapshot
  readonly onEdit: () => void
}

function DomainSummaryContent({ patient }: { readonly patient: PatientSnapshot }) {
  const domainId = patient.domainId

  if (domainId === 'dm-mgmt') {
    return (
      <>
        <span className="font-semibold text-gray-900 truncate">
          HbA1c {patient.hba1c ?? '—'}%
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">Type 2 DM</span>
        {patient.bmi !== undefined && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">BMI {patient.bmi}</span>
          </>
        )}
        {patient.egfr !== undefined && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">eGFR {patient.egfr}</span>
          </>
        )}
      </>
    )
  }

  if (domainId === 'htn-control') {
    return (
      <>
        <span className="font-semibold text-gray-900 truncate">
          BP {patient.sbp}/{patient.dbp ?? '—'}
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600">
          {patient.htnStage === 'resistant' ? 'Resistant HTN' : patient.htnStage === 'stage2' ? 'Stage 2 HTN' : 'Stage 1 HTN'}
        </span>
        {patient.egfr !== undefined && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">eGFR {patient.egfr}</span>
          </>
        )}
      </>
    )
  }

  const efCategory = classifyEF(patient.ef)
  return (
    <>
      <span className="font-semibold text-gray-900 truncate">
        EF {patient.ef}%
      </span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-600">{efCategory}</span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-600">
        NYHA {['I', 'II', 'III', 'IV'][patient.nyhaClass - 1]}
      </span>
    </>
  )
}

export function PatientSummaryBar({ patient, onEdit }: PatientSummaryBarProps) {
  const { t } = useTranslation()

  const activeMedCount = patient.medications.filter(
    (m) => m.doseTier !== 'NOT_PRESCRIBED',
  ).length

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-2.5 mb-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
          </svg>
        </div>

        <div className="flex items-center gap-2 flex-wrap min-w-0 text-sm">
          <DomainSummaryContent patient={patient} />
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 text-xs">
            {t('summary.medsActive', { count: activeMedCount })}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2.5 py-1.5 rounded-md transition-colors flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
        {t('summary.edit')}
      </button>
    </div>
  )
}
