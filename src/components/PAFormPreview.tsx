import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PAFormData } from '../types/resolution.ts'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'

interface PAFormPreviewProps {
  readonly paForm: PAFormData
  readonly onApprove?: () => void
  readonly onGenerateAppeal?: () => void
}

export function PAFormPreview({ paForm, onApprove, onGenerateAppeal }: PAFormPreviewProps) {
  const { t } = useTranslation()
  const [approved, setApproved] = useState(false)
  const [appealRequested, setAppealRequested] = useState(false)

  const handleApprove = useCallback(() => {
    setApproved(true)
    onApprove?.()
  }, [onApprove])

  const handleGenerateAppeal = useCallback(() => {
    setAppealRequested(true)
    onGenerateAppeal?.()
  }, [onGenerateAppeal])

  const missingFields: Array<string> = []
  if (!paForm.insurance.payerName) missingFields.push(t('pa.payerName'))
  if (!paForm.insurance.memberId) missingFields.push(t('pa.memberId'))
  if (!paForm.prescriber.npi) missingFields.push(t('pa.prescriberNPI'))

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
        <h4 className="text-sm font-semibold text-gray-700">
          {t('resolution.paFormPreview')}
        </h4>
        <RuleDerivedLabel />
      </div>

      <div className="p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-medium text-gray-500">{t('pa.diagnosisCode')}</span>
            <p className="font-mono text-gray-900">{paForm.diagnosisCode} - {paForm.diagnosisDescription}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">{t('pa.requestedDrug')}</span>
            <p className="text-gray-900">{paForm.requestedDrug}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-xs font-medium text-gray-500">{t('pa.fieldEF')}</span>
            <p className="text-gray-900">{String(paForm.efPercent)}%</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">{t('pa.fieldNYHA')}</span>
            <p className="text-gray-900">Class {String(paForm.nyhaClass)}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">{t('pa.fieldGuideline')}</span>
            <p className="text-gray-900">{paForm.guidelineClass}</p>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-gray-500">{t('pa.clinicalJustification')}</span>
          <p className="mt-0.5 text-xs text-gray-700 leading-relaxed">{paForm.clinicalJustification}</p>
        </div>

        {paForm.relevantLabs.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500">{t('pa.supportingLabs')}</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {paForm.relevantLabs.map((lab) => (
                <span
                  key={lab.name}
                  className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {lab.name}: {String(lab.value)} {lab.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        {paForm.priorTrials.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-500">{t('pa.priorTrials')}</span>
            <ul className="mt-1 space-y-1">
              {paForm.priorTrials.map((trial) => (
                <li key={`${trial.drugName}-${trial.startDate}`} className="text-xs text-gray-700">
                  {trial.drugName}: {String(trial.durationDays)} days, outcome: {trial.outcome}
                  {trial.reasonStopped && <span className="text-gray-500"> ({trial.reasonStopped})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {paForm.insurance.payerName && (
          <div className="grid grid-cols-2 gap-3 rounded bg-blue-50 p-2">
            <div>
              <span className="text-xs font-medium text-blue-600">{t('pa.payer')}</span>
              <p className="text-xs text-blue-900">{paForm.insurance.payerName}</p>
            </div>
            {paForm.insurance.memberId && (
              <div>
                <span className="text-xs font-medium text-blue-600">{t('pa.memberId')}</span>
                <p className="text-xs text-blue-900">{paForm.insurance.memberId}</p>
              </div>
            )}
          </div>
        )}

        {missingFields.length > 0 && (
          <div className="rounded bg-red-50 p-2">
            <span className="text-xs font-medium text-red-600">{t('pa.missingFields')}:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {missingFields.map((field) => (
                <span key={field} className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-100 px-4 py-2">
        {onApprove && (
          approved ? (
            <div className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t('pa.approved')}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleApprove}
              className="flex-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition-transform"
            >
              {t('pa.reviewAndApprove')}
            </button>
          )
        )}
        {onGenerateAppeal && (
          appealRequested ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t('pa.appealGenerated')}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerateAppeal}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-transform"
            >
              {t('pa.submitAppeal')}
            </button>
          )
        )}
      </div>
    </div>
  )
}
