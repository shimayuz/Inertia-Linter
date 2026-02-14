import { PILLAR_LABELS } from '../types/pillar'
import type { GDMTScore as GDMTScoreType } from '../types/audit'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface GDMTScoreProps {
  readonly score: GDMTScoreType
  readonly efCategory?: string
}

function getScoreColor(normalized: number): string {
  if (normalized <= 30) return 'text-red-600'
  if (normalized <= 60) return 'text-amber-600'
  return 'text-green-600'
}

function getBarColor(normalized: number): string {
  if (normalized <= 30) return 'bg-red-500'
  if (normalized <= 60) return 'bg-amber-500'
  return 'bg-green-500'
}

export function GDMTScore({ score, efCategory }: GDMTScoreProps) {
  const { normalized, maxPossible, excludedPillars, isIncomplete } = score
  const scoreColor = getScoreColor(normalized)
  const barColor = getBarColor(normalized)
  const isHFpEF = efCategory === 'HFpEF'
  const title = isHFpEF ? 'HFpEF Management Score' : 'GDMT Score'
  const activePillarCount = 4 - excludedPillars.length

  return (
    <div className="flex flex-col items-center gap-3" aria-label={`${title}: ${score.score} out of ${maxPossible}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h2>

      <p className={`text-5xl font-extrabold tabular-nums ${scoreColor}`}>
        {score.score}
        <span className="text-2xl font-semibold text-gray-400">/{maxPossible}</span>
      </p>

      <div
        className="h-3 w-48 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={normalized}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score progress: ${normalized}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(normalized, 100)}%` }}
        />
      </div>

      {excludedPillars.length > 0 && (
        <p className="text-xs text-gray-500">
          Calculated from {activePillarCount} {activePillarCount === 1 ? 'pillar' : 'pillars'}
          {' '}({excludedPillars.map((p) => PILLAR_LABELS[p]).join(', ')} excluded as contraindicated)
        </p>
      )}

      {isIncomplete && (
        <p className="text-xs text-amber-600">
          * Incomplete data — some values unknown
        </p>
      )}

      <RuleDerivedLabel className="mt-1" />
    </div>
  )
}
