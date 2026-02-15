import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditResult } from '../types/audit.ts'
import type { ActionDecision, ActionDecisionRecord } from '../types/action-plan.ts'
import type { LLMContext } from '../engine/prepare-llm-context.ts'
import { generateActionPlan } from '../engine/generate-action-plan.ts'
import { ActionItemCard } from './ActionItemCard.tsx'
import { VisitSummaryPanel } from './VisitSummaryPanel.tsx'
import { AuditChat } from './AuditChat.tsx'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'

interface InertiaActionPlanProps {
  readonly auditResult: AuditResult | null
  readonly llmContext: LLMContext | null
}

export function InertiaActionPlan({ auditResult, llmContext }: InertiaActionPlanProps) {
  const { t } = useTranslation()
  const [decisions, setDecisions] = useState<ReadonlyArray<ActionDecisionRecord>>([])
  const [chatOpen, setChatOpen] = useState(false)

  const actions = useMemo(
    () => (auditResult ? generateActionPlan(auditResult) : []),
    [auditResult],
  )

  const decisionMap = useMemo(() => {
    const map: Record<string, ActionDecisionRecord> = {}
    for (const d of decisions) {
      map[d.actionId] = d
    }
    return map as Readonly<Record<string, ActionDecisionRecord>>
  }, [decisions])

  const undecidedCount = useMemo(() => {
    return actions.filter((a) => {
      const d = decisionMap[a.id]
      return !d || d.decision === 'undecided'
    }).length
  }, [actions, decisionMap])

  const handleDecide = useCallback(
    (actionId: string, decision: ActionDecision, reason?: string) => {
      if (decision === 'undecided') {
        setDecisions((prev) => prev.filter((d) => d.actionId !== actionId))
        return
      }

      const record: ActionDecisionRecord = {
        actionId,
        decision,
        reason,
        timestamp: new Date().toISOString(),
      }

      setDecisions((prev) => {
        const filtered = prev.filter((d) => d.actionId !== actionId)
        return [...filtered, record]
      })
    },
    [],
  )

  const toggleChat = useCallback(() => {
    setChatOpen((prev) => !prev)
  }, [])

  if (!auditResult) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">
            {t('action.title')}
          </h4>
          <RuleDerivedLabel />
        </div>
        <p className="text-sm text-gray-400 text-center py-8">
          {t('action.noActions')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h4 className="text-sm font-semibold text-gray-700">
              {t('action.title')}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {undecidedCount > 0
                ? t('action.subtitle', { count: undecidedCount })
                : t('action.allDecided')}
            </p>
          </div>
          <RuleDerivedLabel />
        </div>

        {actions.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">{t('action.noActions')}</p>
          </div>
        ) : (
          <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
            {actions.map((action) => (
              <ActionItemCard
                key={action.id}
                item={action}
                decision={decisionMap[action.id]?.decision ?? 'undecided'}
                onDecide={handleDecide}
              />
            ))}
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <VisitSummaryPanel
          auditResult={auditResult}
          actions={actions}
          decisions={decisions}
        />
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={toggleChat}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50/50 transition-colors"
          aria-expanded={chatOpen}
        >
          <span className="text-sm font-medium text-gray-500">
            {t('action.askAI')}
          </span>
          <span
            className="text-gray-400 transition-transform duration-200"
            style={{ transform: chatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            &#9660;
          </span>
        </button>
        {chatOpen && (
          <AuditChat auditResult={auditResult} llmContext={llmContext} />
        )}
      </div>
    </div>
  )
}
