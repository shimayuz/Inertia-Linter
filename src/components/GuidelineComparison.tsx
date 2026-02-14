import type { GuidelineComparison as GuidelineComparisonType } from '../types/guideline'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface GuidelineComparisonProps {
  readonly comparisons: ReadonlyArray<GuidelineComparisonType>
}

function PositionCell({
  source,
  cls,
  loe,
  year,
  note,
}: {
  readonly source: string
  readonly cls: string
  readonly loe: string
  readonly year: number
  readonly note?: string
}) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-gray-700">{source}</span>
      <span className="text-gray-500"> ({year})</span>
      <div className="text-gray-600">
        Class {cls}, LOE {loe}
      </div>
      {note && (
        <div className="text-xs text-gray-400 mt-0.5">{note}</div>
      )}
    </div>
  )
}

function ComparisonCard({
  comparison,
}: {
  readonly comparison: GuidelineComparisonType
}) {
  const borderClass = comparison.hasDifference
    ? 'border-amber-300 bg-amber-50/50'
    : 'border-gray-200 bg-white'

  return (
    <div className={`rounded-lg border-2 p-3 space-y-2 ${borderClass}`}>
      <div className="flex items-center gap-2">
        <h5 className="text-sm font-semibold text-gray-800">
          {comparison.topic}
        </h5>
        {comparison.hasDifference && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Guidelines differ
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {comparison.positions.map((pos) => (
          <PositionCell
            key={pos.source}
            source={pos.source}
            cls={pos.class}
            loe={pos.loe}
            year={pos.year}
            note={pos.note}
          />
        ))}
      </div>
    </div>
  )
}

export function GuidelineComparisonPanel({
  comparisons,
}: GuidelineComparisonProps) {
  if (comparisons.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">
        Multi-Guideline Comparison
      </h4>

      <div className="space-y-2">
        {comparisons.map((c) => (
          <ComparisonCard key={c.topic} comparison={c} />
        ))}
      </div>

      <RuleDerivedLabel />
    </div>
  )
}
