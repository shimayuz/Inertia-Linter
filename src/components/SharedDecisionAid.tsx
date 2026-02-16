import { useTranslation } from 'react-i18next'
import type { SharedDecisionContext, DecisionOption } from '../types/patient-view.ts'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'

interface SharedDecisionAidProps {
  readonly context: SharedDecisionContext
}

interface OptionCardProps {
  readonly option: DecisionOption
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function getEvidenceBadgeColor(level?: string): string {
  if (!level) return 'bg-gray-100 text-gray-600'
  const lower = level.toLowerCase()
  if (lower.includes('strong') || lower.includes('class i') || lower.includes('class a')) {
    return 'bg-green-100 text-green-700'
  }
  if (lower.includes('moderate') || lower.includes('class ii') || lower.includes('class b')) {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-gray-100 text-gray-600'
}

function getCostLabel(estimate?: string): string {
  if (!estimate) return ''
  switch (estimate) {
    case '$': return 'Lower cost'
    case '$$': return 'Moderate cost'
    case '$$$': return 'Higher cost'
    default: return estimate
  }
}

function OptionCard({ option }: OptionCardProps) {
  const evidenceBadgeColor = getEvidenceBadgeColor(option.evidenceLevel)
  const costLabel = getCostLabel(option.costEstimate)

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3">
        <h4 className="text-base font-bold text-gray-900">
          {option.title}
        </h4>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          {option.description}
        </p>
      </div>

      {/* Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        {option.evidenceLevel && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${evidenceBadgeColor}`}>
            {option.evidenceLevel}
          </span>
        )}
        {costLabel && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600">
            {costLabel}
          </span>
        )}
      </div>

      {/* Pros */}
      {option.pros.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-green-600">
            Benefits
          </p>
          <ul className="space-y-1.5">
            {option.pros.map((pro) => (
              <li key={pro} className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-sm text-gray-700">{pro}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cons */}
      {option.cons.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-500">
            Considerations
          </p>
          <ul className="space-y-1.5">
            {option.cons.map((con) => (
              <li key={con} className="flex items-start gap-2">
                <XIcon />
                <span className="text-sm text-gray-700">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function SharedDecisionAid({ context }: SharedDecisionAidProps) {
  const { t } = useTranslation()

  return (
    <div
      className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm"
      aria-label={t('patientView.sharedDecision', 'Shared Decision Aid')}
    >
      {/* Question */}
      <h3 className="text-lg font-bold text-gray-900 mb-5">
        {context.question}
      </h3>

      {/* Risk / Benefit callouts */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
          <WarningIcon />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
              Risk without treatment
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">
              {context.riskWithout}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
          <ShieldIcon />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-1">
              Benefit with treatment
            </p>
            <p className="text-sm text-green-900 leading-relaxed">
              {context.benefitWith}
            </p>
          </div>
        </div>
      </div>

      {/* Options grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {context.options.map((option) => (
          <OptionCard key={option.id} option={option} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-gray-400 max-w-md leading-relaxed">
          This information is meant to support a conversation with your care team. Your doctor can help you choose the best option for your situation.
        </p>
        <RuleDerivedLabel />
      </div>
    </div>
  )
}
