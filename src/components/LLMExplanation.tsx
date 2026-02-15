import { useTranslation } from 'react-i18next'
import type { LLMContext } from '../engine/prepare-llm-context'
import { useLLMExplanation } from '../hooks/useLLMExplanation'
import { AIGeneratedLabel } from './labels/AIGeneratedLabel'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface LLMExplanationProps {
  readonly context: LLMContext | null
}

export function LLMExplanation({ context }: LLMExplanationProps) {
  const { t } = useTranslation()
  const { explanation, isLoading, isAIGenerated } = useLLMExplanation(context)

  if (!context) {
    return null
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">
          {t('llm.auditSummary')}
        </h4>
        {isAIGenerated ? (
          <AIGeneratedLabel />
        ) : (
          <RuleDerivedLabel />
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          {t('llm.generating')}
        </div>
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  )
}
