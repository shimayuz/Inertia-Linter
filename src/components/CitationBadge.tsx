import type { Citation } from '../types/chat.ts'

interface CitationBadgeProps {
  readonly citation: Citation
  readonly index: number
}

const STYLE_BY_TYPE: Readonly<
  Record<Citation['type'], string>
> = {
  guideline: 'bg-blue-50 text-blue-700 border-blue-200',
  trial: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  patient: 'bg-purple-50 text-purple-700 border-purple-200',
}

function buildTooltip(citation: Citation): string {
  if (citation.detail) {
    return `${citation.label} — ${citation.detail}`
  }
  return citation.label
}

export function CitationBadge({ citation, index }: CitationBadgeProps) {
  const colorClasses = STYLE_BY_TYPE[citation.type]
  const tooltip = buildTooltip(citation)

  const content = (
    <>
      <sup className="font-semibold mr-0.5">{index}</sup>
      {citation.label}
    </>
  )

  const baseClasses = `inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${colorClasses}`

  if (citation.type === 'guideline' && citation.detail) {
    return (
      <a
        href={`https://doi.org/${citation.detail}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} hover:opacity-80 transition-opacity no-underline`}
        title={tooltip}
      >
        {content}
      </a>
    )
  }

  return (
    <span className={baseClasses} title={tooltip}>
      {content}
    </span>
  )
}
