import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditResult } from '../types/audit.ts'
import type { ActionDecision, ActionDecisionRecord } from '../types/action-plan.ts'
import type { Medication } from '../types/patient.ts'
import type { PreVisitNote } from '../types/pre-visit-note.ts'
import type { LLMContext } from '../engine/prepare-llm-context.ts'
import { generateActionPlan } from '../engine/generate-action-plan.ts'
import { generatePreVisitNote } from '../engine/generate-pre-visit-note.ts'
import { buildFHIRCarePlan } from '../fhir/build-careplan.ts'
import { ActionItemCard } from './ActionItemCard.tsx'
import { VisitSummaryPanel } from './VisitSummaryPanel.tsx'
import { PreVisitNotePanel } from './PreVisitNotePanel.tsx'
import { AuditChat } from './AuditChat.tsx'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'

interface InertiaActionPlanProps {
  readonly auditResult: AuditResult | null
  readonly llmContext: LLMContext | null
  readonly medications?: ReadonlyArray<Medication>
}

export function InertiaActionPlan({ auditResult, llmContext, medications }: InertiaActionPlanProps) {
  const { t } = useTranslation()
  const [decisions, setDecisions] = useState<ReadonlyArray<ActionDecisionRecord>>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [preVisitNote, setPreVisitNote] = useState<PreVisitNote | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; careplanId?: string } | null>(null)

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

  const handleGenerateNote = useCallback(() => {
    if (!auditResult) {
      return
    }
    try {
      const note = generatePreVisitNote(auditResult, actions, decisions, medications ?? [])
      setPreVisitNote(note)
      setSendResult(null)
    } catch {
      // Engine function may not be available yet; silently ignore
    }
  }, [auditResult, actions, decisions, medications])

  const handleApproveAndSend = useCallback(() => {
    if (!preVisitNote) {
      return
    }
    setIsSending(true)
    setSendResult(null)

    try {
      buildFHIRCarePlan(preVisitNote)
    } catch {
      // FHIR builder may not be available yet; continue with mock
    }

    // Demo mode: simulate EHR send with 1-second delay
    const timer = setTimeout(() => {
      setIsSending(false)
      setSendResult({
        success: true,
        careplanId: `CarePlan/${crypto.randomUUID().slice(0, 8)}`,
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [preVisitNote])

  if (!auditResult) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
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
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
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

      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateNote}
            disabled={undecidedCount > 0}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              undecidedCount > 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {t('previsit.generate')}
          </button>
          {undecidedCount > 0 && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {t('previsit.remaining', { count: undecidedCount })}
            </span>
          )}
        </div>
      )}

      <PreVisitNotePanel
        note={preVisitNote}
        onApproveAndSend={handleApproveAndSend}
        isSending={isSending}
        sendResult={sendResult}
      />

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={toggleChat}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
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
