import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { MedicationAlternative, AssistanceProgram } from '../types/resolution.ts'

interface AlternativesPanelProps {
  readonly alternatives: ReadonlyArray<MedicationAlternative>
  readonly assistancePrograms: ReadonlyArray<AssistanceProgram>
  readonly onSwitchTo?: (drugName: string) => void
}

const EQUIVALENCE_STYLES: Readonly<Record<string, string>> = {
  equivalent: 'bg-green-100 text-green-700',
  similar: 'bg-blue-100 text-blue-700',
  different_mechanism: 'bg-amber-100 text-amber-700',
}

const PROGRAM_TYPE_LABELS: Readonly<Record<string, string>> = {
  pap: 'PAP',
  copay_card: 'Copay Card',
  foundation: 'Foundation',
  pharmacy_discount: 'Discount',
}

export function AlternativesPanel({ alternatives, assistancePrograms, onSwitchTo }: AlternativesPanelProps) {
  const { t } = useTranslation()
  const [switchedDrugs, setSwitchedDrugs] = useState<ReadonlySet<string>>(new Set())

  const handleSwitch = useCallback((drugName: string) => {
    setSwitchedDrugs((prev) => new Set([...prev, drugName]))
    onSwitchTo?.(drugName)
  }, [onSwitchTo])

  if (alternatives.length === 0 && assistancePrograms.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {alternatives.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {t('resolution.genericSwitch')}
            </h4>
          </div>
          <div className="p-3 space-y-2">
            {alternatives.map((alt) => (
              <div
                key={alt.drugName}
                className="flex items-start gap-3 rounded-lg border border-gray-100 p-2.5"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{alt.drugName}</span>
                    {alt.isGeneric && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                        {t('resolution.labelGeneric')}
                      </span>
                    )}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${EQUIVALENCE_STYLES[alt.clinicalEquivalence]}`}>
                      {alt.clinicalEquivalence}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{alt.genericName}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="font-semibold text-green-700">
                      {t('resolution.costSavings')}: {alt.estimatedMonthlyCost}/mo
                    </span>
                    <span className="text-gray-400">
                      {t('resolution.formulary')}: {alt.formularyLikelihood}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">{alt.guidelineSupport}</p>
                  {alt.switchConsiderations.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {alt.switchConsiderations.slice(0, 2).map((consideration, i) => (
                        <li key={i} className="flex items-start gap-1 text-[11px] text-gray-500">
                          <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                          {consideration}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {onSwitchTo && (
                  switchedDrugs.has(alt.drugName) ? (
                    <div className="shrink-0 flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t('resolution.switched')}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitch(alt.drugName)}
                      className="shrink-0 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] transition-transform"
                    >
                      {t('resolution.buttonSwitch')}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {assistancePrograms.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {t('resolution.assistancePrograms')}
            </h4>
          </div>
          <div className="p-3 space-y-2">
            {assistancePrograms.map((program) => (
              <div
                key={program.id}
                className="rounded-lg border border-gray-100 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{program.programName}</span>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                    {PROGRAM_TYPE_LABELS[program.programType] ?? program.programType}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{program.manufacturer}</p>
                <p className="mt-1 text-xs font-semibold text-green-700">
                  {t('resolution.savings')}: {program.estimatedSavings}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {program.eligibilityCriteria.slice(0, 2).map((criteria, i) => (
                    <span key={i} className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {criteria}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
