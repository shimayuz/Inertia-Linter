import { useTranslation } from 'react-i18next'
import { PILLAR_LABELS } from '../types/pillar'
import type { GDMTScore } from '../types/audit'
import type { PatientSnapshot } from '../types/patient.ts'
import type { AuditResult } from '../types/audit'
import { ExportButton } from './ExportButton'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface StickyScoreBarProps {
  readonly score: GDMTScore
  readonly efCategory?: string
  readonly auditResult: AuditResult
  readonly patient: PatientSnapshot
}

function getBarColor(normalized: number): string {
  if (normalized <= 30) return 'bg-red-500'
  if (normalized <= 60) return 'bg-amber-500'
  return 'bg-green-500'
}

function getScoreColor(normalized: number): string {
  if (normalized <= 30) return 'text-red-600'
  if (normalized <= 60) return 'text-amber-600'
  return 'text-green-600'
}

export function StickyScoreBar({ score, efCategory, auditResult, patient }: StickyScoreBarProps) {
  const { t } = useTranslation()
  const { normalized, maxPossible, excludedPillars } = score
  const barColor = getBarColor(normalized)
  const scoreColor = getScoreColor(normalized)
  const isHFpEF = efCategory === 'HFpEF'
  const domainId = auditResult.domainId
  const categoryLabel = auditResult.categoryLabel
  const title = domainId === 'dm-mgmt'
    ? 'DM Management Score'
    : domainId === 'htn-control'
      ? 'HTN Control Score'
      : t(isHFpEF ? 'score.hfpefScore' : 'score.gdmtScore')

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2.5 -mx-5 mb-4"
         style={{ marginLeft: '-1.25rem', marginRight: '-1.25rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {title}
          </span>
          <span className={`text-xl font-extrabold font-mono tabular-nums ${scoreColor}`}>
            {score.score}
            <span className="text-sm font-semibold text-gray-300">/{maxPossible}</span>
          </span>
        </div>

        <div
          className="h-2 w-32 overflow-hidden rounded-full bg-gray-100 flex-shrink-0"
          role="progressbar"
          aria-valuenow={normalized}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(normalized, 100)}%` }}
          />
        </div>

        {(categoryLabel ?? efCategory) && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {categoryLabel ?? efCategory}
          </span>
        )}

        {excludedPillars.length > 0 && (
          <span className="text-[10px] text-gray-400 hidden lg:inline">
            {t('score.excludedContraindicated', {
              pillars: excludedPillars.map((p) => PILLAR_LABELS[p]).join(', '),
            })}
          </span>
        )}

        <div className="flex-1" />

        <RuleDerivedLabel className="hidden sm:block" />
        <ExportButton auditResult={auditResult} patient={patient} />
      </div>
    </div>
  )
}
