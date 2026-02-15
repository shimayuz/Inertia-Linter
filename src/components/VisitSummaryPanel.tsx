import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditResult } from '../types/audit.ts'
import type { ActionItem, ActionDecisionRecord } from '../types/action-plan.ts'
import { generateVisitSummary } from '../engine/generate-visit-summary.ts'

interface VisitSummaryPanelProps {
  readonly auditResult: AuditResult
  readonly actions: ReadonlyArray<ActionItem>
  readonly decisions: ReadonlyArray<ActionDecisionRecord>
}

export function VisitSummaryPanel({
  auditResult,
  actions,
  decisions,
}: VisitSummaryPanelProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const summaryText = useMemo(
    () => generateVisitSummary(auditResult, actions, decisions),
    [auditResult, actions, decisions],
  )

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true)
    })
  }, [summaryText])

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <h4 className="text-sm font-semibold text-gray-700">
          {t('action.visitSummary')}
        </h4>
        <button
          type="button"
          onClick={handleCopy}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            copied
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
          }`}
        >
          {copied ? t('action.copied') : t('action.copySummary')}
        </button>
      </div>

      <div className="relative">
        <pre className="px-4 py-3 text-xs leading-relaxed font-mono text-gray-600 whitespace-pre-wrap bg-gray-50/30">
          {summaryText}
        </pre>
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        >
          <span className="text-3xl font-bold text-gray-400/15 -rotate-12 select-none whitespace-nowrap">
            DRAFT
          </span>
        </div>
      </div>
    </div>
  )
}
