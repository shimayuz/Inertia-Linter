import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActionItem, ActionDecision } from '../types/action-plan'

interface ActionItemCardProps {
  readonly item: ActionItem
  readonly decision: ActionDecision
  readonly onDecide: (actionId: string, decision: ActionDecision, reason?: string) => void
}

const PRIORITY_DOT: Readonly<Record<string, string>> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
}

const PRIORITY_TEXT: Readonly<Record<string, string>> = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-blue-600',
}

const DECISION_BADGE: Readonly<Record<string, string>> = {
  address_now: 'bg-emerald-100 text-emerald-700',
  defer: 'bg-amber-100 text-amber-700',
  not_applicable: 'bg-gray-100 text-gray-500',
}

const DECISION_LABEL_KEYS = {
  address_now: 'action.addressNow',
  defer: 'action.defer',
  not_applicable: 'action.notApplicable',
} as const

const PRIORITY_LABEL_KEYS = {
  high: 'action.priorityHigh',
  medium: 'action.priorityMedium',
  low: 'action.priorityLow',
} as const

export function ActionItemCard({ item, decision, onDecide }: ActionItemCardProps) {
  const { t } = useTranslation()
  const [cautionsOpen, setCautionsOpen] = useState(false)
  const [reasonText, setReasonText] = useState('')
  const [pendingDecision, setPendingDecision] = useState<'defer' | 'not_applicable' | null>(null)

  const isDecided = decision !== 'undecided'

  const handleToggleCautions = useCallback(() => {
    setCautionsOpen((prev) => !prev)
  }, [])

  const handleAddressNow = useCallback(() => {
    onDecide(item.id, 'address_now')
  }, [item.id, onDecide])

  const handleDeferOrNA = useCallback((type: 'defer' | 'not_applicable') => {
    setPendingDecision(type)
    setReasonText('')
  }, [])

  const handleConfirmDecision = useCallback(() => {
    if (pendingDecision) {
      onDecide(item.id, pendingDecision, reasonText.trim() || undefined)
      setPendingDecision(null)
      setReasonText('')
    }
  }, [item.id, pendingDecision, reasonText, onDecide])

  const handleCancelPending = useCallback(() => {
    setPendingDecision(null)
    setReasonText('')
  }, [])

  const handleChangeDecision = useCallback(() => {
    onDecide(item.id, 'undecided')
    setPendingDecision(null)
    setReasonText('')
  }, [item.id, onDecide])

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReasonText(e.target.value)
  }, [])

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 transition-opacity duration-200 ${
        isDecided ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT[item.priority]}`}
          aria-hidden="true"
        />
        <span className={`text-xs font-medium ${PRIORITY_TEXT[item.priority]}`}>
          {t(PRIORITY_LABEL_KEYS[item.priority])}
        </span>
        <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
      </div>

      <p className="mt-2 text-sm text-gray-600">{item.rationale}</p>

      <p className="mt-2 text-sm font-medium text-gray-800">{item.suggestedAction}</p>

      <span className="mt-2 inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
        {item.evidence}
      </span>

      {item.cautions.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={handleToggleCautions}
            className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
            aria-expanded={cautionsOpen}
          >
            <span aria-hidden="true">{cautionsOpen ? '\u25BE' : '\u25B8'}</span>
            {t('action.cautions')} ({item.cautions.length})
          </button>
          {cautionsOpen && (
            <ul className="mt-1.5 space-y-1 pl-4">
              {item.cautions.map((caution, index) => (
                <li
                  key={`${item.id}-caution-${index}`}
                  className="flex items-start gap-1.5 text-xs text-amber-700"
                >
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                  {caution}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4">
        {isDecided ? (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${DECISION_BADGE[decision]}`}>
              {t(DECISION_LABEL_KEYS[decision])}
            </span>
            <button
              type="button"
              onClick={handleChangeDecision}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              {t('action.decided')}
            </button>
          </div>
        ) : pendingDecision ? (
          <div className="space-y-2">
            <input
              type="text"
              value={reasonText}
              onChange={handleReasonChange}
              placeholder={t('action.reasonPlaceholder')}
              className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDecision}
                className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {t(DECISION_LABEL_KEYS[pendingDecision])}
              </button>
              <button
                type="button"
                onClick={handleCancelPending}
                className="rounded px-3 py-1 text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddressNow}
              className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              {t('action.addressNow')}
            </button>
            <button
              type="button"
              onClick={() => handleDeferOrNA('defer')}
              className="rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              {t('action.defer')}
            </button>
            <button
              type="button"
              onClick={() => handleDeferOrNA('not_applicable')}
              className="rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              {t('action.notApplicable')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
