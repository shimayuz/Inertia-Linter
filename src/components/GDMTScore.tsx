import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const { normalized, maxPossible, excludedPillars, isIncomplete } = score
  const scoreColor = getScoreColor(normalized)
  const barColor = getBarColor(normalized)
  const isHFpEF = efCategory === 'HFpEF'
  const title = t(isHFpEF ? 'score.hfpefScore' : 'score.gdmtScore')
  const activePillarCount = 4 - excludedPillars.length

  return (
    <div className="flex flex-col items-center gap-3 bg-white rounded-lg border border-gray-200 p-6" aria-label={t('score.ariaLabel', { title, score: score.score, max: maxPossible })}>
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {title}
      </h2>

      <p className={`text-5xl font-extrabold font-mono tabular-nums tracking-tight ${scoreColor}`}>
        {score.score}
        <span className="text-2xl font-semibold font-mono text-gray-300">/{maxPossible}</span>
      </p>

      <div
        className="h-2.5 w-48 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={normalized}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('score.progressLabel', { percent: normalized })}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(normalized, 100)}%` }}
        />
      </div>

      {excludedPillars.length > 0 && (
        <p className="text-xs text-gray-500">
          {t('score.calculatedFrom', { count: activePillarCount })}
          {' '}({t('score.excludedContraindicated', { pillars: excludedPillars.map((p) => PILLAR_LABELS[p]).join(', ') })})
        </p>
      )}

      {isIncomplete && (
        <p className="text-xs text-amber-600">
          {t('score.incompleteData')}
        </p>
      )}

      <RuleDerivedLabel className="mt-1" />
    </div>
  )
}
