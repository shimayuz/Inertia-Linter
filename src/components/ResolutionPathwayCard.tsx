import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ResolutionPathway } from '../types/resolution.ts'

interface ResolutionPathwayCardProps {
  readonly pathway: ResolutionPathway
  readonly isPrimary: boolean
  readonly isStarted?: boolean
  readonly onSelect: (pathwayId: string) => void
  readonly onStart: (pathwayId: string) => void
}

const URGENCY_STYLES: Readonly<Record<string, string>> = {
  immediate: 'text-red-600 bg-red-50',
  within_visit: 'text-amber-600 bg-amber-50',
  within_week: 'text-blue-600 bg-blue-50',
  next_visit: 'text-gray-600 bg-gray-50',
}

const AUTOMATION_STYLES: Readonly<Record<string, string>> = {
  full: 'bg-green-100 text-green-700',
  partial: 'bg-blue-100 text-blue-700',
  manual: 'bg-gray-100 text-gray-600',
}

export function ResolutionPathwayCard({ pathway, isPrimary, isStarted = false, onSelect, onStart }: ResolutionPathwayCardProps) {
  const { t } = useTranslation()
  const [clicked, setClicked] = useState(false)

  const handleSelect = useCallback(() => {
    onSelect(pathway.id)
  }, [pathway.id, onSelect])

  const handleStart = useCallback(() => {
    setClicked(true)
    onStart(pathway.id)
  }, [pathway.id, onStart])

  const automatedSteps = pathway.steps.filter((s) => s.isAutomated).length
  const totalSteps = pathway.steps.length
  const started = isStarted || clicked

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        started
          ? 'border-green-300 bg-green-50/30'
          : isPrimary ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {started ? (
            <span className="mb-1 inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-700">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t('resolution.inProgress')}
            </span>
          ) : isPrimary ? (
            <span className="mb-1 inline-block rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-700">
              {t('resolution.primaryPathway')}
            </span>
          ) : (
            <span className="mb-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
              {t('resolution.alternativePathway')}
            </span>
          )}
          <h4 className="text-sm font-semibold text-gray-900">{pathway.title}</h4>
          <p className="mt-1 text-xs text-gray-600">{pathway.description}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${URGENCY_STYLES[pathway.urgency]}`}>
          {pathway.urgency.replace('_', ' ')}
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${AUTOMATION_STYLES[pathway.automationLevel]}`}>
          {automatedSteps}/{totalSteps} auto
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
          {t('resolution.estimatedTime')}: {pathway.estimatedTime}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {pathway.steps.map((step) => (
          <div key={step.id} className="flex items-start gap-1.5 text-xs text-gray-500">
            <span className={`mt-0.5 shrink-0 ${started && step.isAutomated ? 'text-green-600' : ''}`} aria-hidden="true">
              {step.isAutomated ? '\u2713' : '\u25CB'}
            </span>
            <span className={started && step.isAutomated ? 'text-green-700 line-through' : ''}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {started ? (
          <div className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {t('resolution.inProgress')}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleStart}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isPrimary
                  ? 'bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98]'
              }`}
            >
              {t('resolution.oneClickApprove')}
            </button>
            {!isPrimary && (
              <button
                type="button"
                onClick={handleSelect}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
              >
                {t('resolution.details')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
