import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditResult } from '../types/audit.ts'
import type { Medication, PatientSnapshot } from '../types/patient.ts'
import type { LLMContext } from '../engine/prepare-llm-context.ts'
import { InertiaActionPlan } from './InertiaActionPlan.tsx'

interface FloatingActionPanelProps {
  readonly auditResult: AuditResult | null
  readonly llmContext: LLMContext | null
  readonly medications?: ReadonlyArray<Medication>
  readonly snapshot?: PatientSnapshot | null
  readonly pendingCount: number
}

export function FloatingActionPanel({
  auditResult,
  llmContext,
  medications,
  snapshot,
  pendingCount,
}: FloatingActionPanelProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Auto-open when audit result changes (new patient selected)
  useEffect(() => {
    if (auditResult && pendingCount > 0) {
      setIsOpen(true)
    }
  }, [auditResult, pendingCount])

  if (!auditResult) {
    return null
  }

  return (
    <>
      {/* Backdrop — subtle overlay when panel is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-opacity"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Floating Panel */}
      {isOpen ? (
        <div
          className="fixed bottom-3 right-3 z-50 flex flex-col rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-2xl"
          style={{ width: 'min(680px, calc(100vw - 340px))', maxHeight: 'calc(100vh - 80px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100">
                <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {t('action.title')}
              </span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {pendingCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close action panel"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto form-scroll p-3">
            <InertiaActionPlan
              auditResult={auditResult}
              llmContext={llmContext}
              medications={medications}
              snapshot={snapshot}
            />
          </div>
        </div>
      ) : (
        /* Collapsed trigger button */
        <button
          type="button"
          onClick={toggle}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-lg hover:shadow-xl hover:border-teal-300 transition-all active:scale-[0.97]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-4.5 w-4.5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {t('action.title')}
          </span>
          {pendingCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      )}
    </>
  )
}
