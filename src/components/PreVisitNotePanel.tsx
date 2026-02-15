import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PreVisitNote, MedicationChangeType } from '../types/pre-visit-note.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'
import { DOSE_TIER_LABELS } from '../types/dose-tier.ts'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'
import { DraftWatermark } from './labels/DraftWatermark.tsx'

interface PreVisitNotePanelProps {
  readonly note: PreVisitNote | null
  readonly onApproveAndSend: () => void
  readonly isSending: boolean
  readonly sendResult: { success: boolean; careplanId?: string } | null
}

const CHANGE_BADGE_STYLES: Readonly<Record<MedicationChangeType, string>> = {
  INITIATE: 'bg-emerald-100 text-emerald-700',
  UPTITRATE: 'bg-amber-100 text-amber-700',
  CONTINUE: 'bg-gray-100 text-gray-500',
  DISCONTINUE: 'bg-red-100 text-red-700',
}

const CHANGE_LABEL_KEYS = {
  INITIATE: 'previsit.changeInitiate',
  UPTITRATE: 'previsit.changeUptitrate',
  CONTINUE: 'previsit.changeContinue',
  DISCONTINUE: 'previsit.changeDiscontinue',
} as const satisfies Readonly<Record<MedicationChangeType, string>>

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

function buildPlainText(
  note: PreVisitNote,
  t: TranslateFn,
): string {
  const lines: Array<string> = [
    t('previsit.title'),
    `Date: ${note.generatedAt} | EF: ${note.efCategory} | GDMT Score: ${String(note.gdmtScore)}`,
    '',
    `── ${t('previsit.medicationPlan')} ──`,
  ]

  for (const plan of note.medicationPlans) {
    const pillarLabel = PILLAR_LABELS[plan.pillar]
    const changeLabel = t(CHANGE_LABEL_KEYS[plan.changeType])
    lines.push(`${pillarLabel}: ${changeLabel} ${plan.drugName}`)
    lines.push(
      `  ${t('previsit.current')}: ${DOSE_TIER_LABELS[plan.currentDose]} → ${t('previsit.target')}: ${DOSE_TIER_LABELS[plan.targetDose]}`,
    )
    lines.push(`  ${t('previsit.rationale')}: ${plan.rationale}`)
    if (plan.monitoringItems.length > 0) {
      lines.push(`  ${t('previsit.monitor')}: ${plan.monitoringItems.join(', ')}`)
    }
    lines.push('')
  }

  if (note.patientExplanations.length > 0) {
    lines.push(`── ${t('previsit.patientExplanation')} ──`)
    for (const explanation of note.patientExplanations) {
      const pillarLabel = PILLAR_LABELS[explanation.pillar]
      lines.push(`${pillarLabel}: ${explanation.explanation}`)
      if (explanation.sideEffectsToWatch.length > 0) {
        lines.push(`  ${t('previsit.sideEffects')}: ${explanation.sideEffectsToWatch.join(', ')}`)
      }
      lines.push(`  ${t('previsit.whenToCall')}: ${explanation.whenToCallDoctor}`)
      lines.push('')
    }
  }

  if (note.deferredItems.length > 0) {
    lines.push(`── ${t('previsit.deferred')} ──`)
    for (const deferred of note.deferredItems) {
      const pillarLabel = PILLAR_LABELS[deferred.pillar]
      lines.push(`• ${pillarLabel}: ${t('previsit.deferredReason')} (${deferred.reason})`)
    }
    lines.push('')
  }

  if (note.nextVisitMonitoring.length > 0) {
    lines.push(`── ${t('previsit.monitoring')} ──`)
    for (const item of note.nextVisitMonitoring) {
      lines.push(`• ${item}`)
    }
    lines.push('')
  }

  lines.push('[DRAFT — Not a clinical document]')
  return lines.join('\n')
}

export function PreVisitNotePanel({
  note,
  onApproveAndSend,
  isSending,
  sendResult,
}: PreVisitNotePanelProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [medPlanOpen, setMedPlanOpen] = useState(true)
  const [explanationsOpen, setExplanationsOpen] = useState(true)

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const plainText = useMemo(
    () => (note ? buildPlainText(note, t as unknown as TranslateFn) : ''),
    [note, t],
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true)
    })
  }, [plainText])

  const toggleMedPlan = useCallback(() => {
    setMedPlanOpen((prev) => !prev)
  }, [])

  const toggleExplanations = useCallback(() => {
    setExplanationsOpen((prev) => !prev)
  }, [])

  if (!note) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-base">📋</span>
          <h4 className="text-sm font-semibold text-gray-700">
            {t('previsit.title')}
          </h4>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            DRAFT
          </span>
        </div>
        <RuleDerivedLabel />
      </div>

      <DraftWatermark>
        <div className="p-4 space-y-4">
          {/* Medication Adjustment Plan */}
          <section>
            <button
              type="button"
              onClick={toggleMedPlan}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-800 transition-colors"
              aria-expanded={medPlanOpen}
            >
              <span
                className="transition-transform duration-200"
                style={{ transform: medPlanOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                aria-hidden="true"
              >
                &#9654;
              </span>
              {t('previsit.medicationPlan')}
            </button>

            {medPlanOpen && (
              <div className="mt-2 space-y-2">
                {note.medicationPlans.map((plan) => (
                  <div
                    key={`${plan.pillar}-${plan.drugName}`}
                    className="rounded-lg border border-gray-150 bg-gray-50/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {PILLAR_LABELS[plan.pillar]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${CHANGE_BADGE_STYLES[plan.changeType]}`}
                      >
                        {t(CHANGE_LABEL_KEYS[plan.changeType])}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm font-medium text-gray-700">
                      {plan.drugName}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {t('previsit.current')}: {DOSE_TIER_LABELS[plan.currentDose]}
                      {' → '}
                      {t('previsit.target')}: {DOSE_TIER_LABELS[plan.targetDose]}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {t('previsit.rationale')}: {plan.rationale}
                    </p>

                    {plan.monitoringItems.length > 0 && (
                      <p className="mt-1 text-xs text-teal-600">
                        <span aria-hidden="true">📊 </span>
                        {t('previsit.monitor')}: {plan.monitoringItems.join(', ')}
                      </p>
                    )}
                  </div>
                ))}

                {note.medicationPlans.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    (none)
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Patient Explanation Notes */}
          {note.patientExplanations.length > 0 && (
            <section>
              <button
                type="button"
                onClick={toggleExplanations}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-800 transition-colors"
                aria-expanded={explanationsOpen}
              >
                <span
                  className="transition-transform duration-200"
                  style={{ transform: explanationsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  aria-hidden="true"
                >
                  &#9654;
                </span>
                {t('previsit.patientExplanation')}
              </button>

              {explanationsOpen && (
                <div className="mt-2 space-y-2">
                  {note.patientExplanations.map((explanation) => (
                    <div
                      key={`explanation-${explanation.pillar}`}
                      className="rounded-lg border border-gray-150 bg-gray-50/50 p-3"
                    >
                      <p className="text-sm font-medium text-gray-700">
                        {PILLAR_LABELS[explanation.pillar]}: {explanation.explanation}
                      </p>

                      {explanation.sideEffectsToWatch.length > 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          <span aria-hidden="true">⚠️ </span>
                          {t('previsit.sideEffects')}: {explanation.sideEffectsToWatch.join(', ')}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-red-500">
                        <span aria-hidden="true">📞 </span>
                        {t('previsit.whenToCall')}: {explanation.whenToCallDoctor}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Deferred Items */}
          {note.deferredItems.length > 0 && (
            <section>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('previsit.deferred')}
              </h5>
              <ul className="mt-1.5 space-y-1">
                {note.deferredItems.map((item) => (
                  <li
                    key={`deferred-${item.pillar}`}
                    className="flex items-start gap-1.5 text-xs text-gray-500"
                  >
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
                    {PILLAR_LABELS[item.pillar]}: {t('previsit.deferredReason')} ({item.reason})
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Next Visit Monitoring */}
          {note.nextVisitMonitoring.length > 0 && (
            <section>
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t('previsit.monitoring')}
              </h5>
              <ul className="mt-1.5 space-y-1">
                {note.nextVisitMonitoring.map((item) => (
                  <li
                    key={`monitor-${item}`}
                    className="flex items-start gap-1.5 text-xs text-gray-500"
                  >
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-teal-400" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DraftWatermark>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            copied
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
          }`}
        >
          {copied ? t('previsit.copied') : t('previsit.copy')}
        </button>

        {sendResult?.success ? (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5">
            <span aria-hidden="true" className="text-emerald-500">&#10003;</span>
            <span className="text-xs font-medium text-emerald-700">
              {t('previsit.sentDescription', { id: sendResult.careplanId ?? '' })}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onApproveAndSend}
            disabled={isSending}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              isSending
                ? 'bg-teal-300 text-white cursor-wait'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {isSending ? t('previsit.sending') : t('previsit.approveAndSend')}
          </button>
        )}
      </div>
    </div>
  )
}
