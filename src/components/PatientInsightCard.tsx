import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditResult } from '../types/audit.ts'
import { generatePatientInsight } from '../engine/generate-patient-insight.ts'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'

interface PatientInsightCardProps {
  readonly auditResult: AuditResult
}

function getScoreColor(normalized: number): string {
  if (normalized < 30) return 'text-red-500'
  if (normalized <= 60) return 'text-amber-500'
  return 'text-green-500'
}

function getProgressColor(normalized: number): string {
  if (normalized < 30) return 'stroke-red-500'
  if (normalized <= 60) return 'stroke-amber-500'
  return 'stroke-green-500'
}

function getTrackColor(normalized: number): string {
  if (normalized < 30) return 'stroke-red-100'
  if (normalized <= 60) return 'stroke-amber-100'
  return 'stroke-green-100'
}

function getDomainBadgeColor(domainLabel: string): string {
  const lower = domainLabel.toLowerCase()
  if (lower.includes('diabetes')) return 'bg-violet-100 text-violet-700'
  if (lower.includes('blood pressure')) return 'bg-sky-100 text-sky-700'
  return 'bg-teal-100 text-teal-700'
}

const CIRCLE_RADIUS = 54
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

export function PatientInsightCard({ auditResult }: PatientInsightCardProps) {
  const { t } = useTranslation()

  const insight = useMemo(
    () => generatePatientInsight(auditResult),
    [auditResult],
  )

  const normalized = insight.maxScore > 0
    ? Math.round((insight.overallScore / insight.maxScore) * 100)
    : 0

  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * Math.min(normalized, 100)) / 100
  const scoreColor = getScoreColor(normalized)
  const progressColor = getProgressColor(normalized)
  const trackColor = getTrackColor(normalized)
  const badgeColor = getDomainBadgeColor(insight.domainLabel)

  return (
    <div
      className="flex flex-col items-center gap-5 rounded-2xl bg-white p-8 shadow-sm border border-gray-100"
      aria-label={t('patientView.insightCard', 'Your Treatment Optimization Score')}
    >
      {/* Domain badge */}
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
        {insight.domainLabel}
      </span>

      {/* Heading */}
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
        {insight.scoreLabel}
      </h2>

      {/* Circular progress indicator */}
      <div className="relative flex items-center justify-center" aria-hidden="true">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={CIRCLE_RADIUS}
            fill="none"
            strokeWidth="10"
            className={trackColor}
          />
          {/* Progress */}
          <circle
            cx="70"
            cy="70"
            r={CIRCLE_RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={progressColor}
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.6s ease-in-out' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-extrabold tabular-nums ${scoreColor}`}>
            {insight.overallScore}
          </span>
          <span className="text-sm font-medium text-gray-400">
            / {insight.maxScore}
          </span>
        </div>
      </div>

      {/* Screen-reader accessible score */}
      <span className="sr-only">
        {`Score: ${insight.overallScore} out of ${insight.maxScore}`}
      </span>

      {/* Pillars on track */}
      <p className="text-sm font-medium text-gray-600">
        {insight.pillarsOnTrack} of {insight.totalPillars} treatment areas on track
      </p>

      {/* Top action */}
      <div className="w-full rounded-xl bg-blue-50 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
          Recommended next step
        </p>
        <p className="text-sm text-blue-900">
          {insight.topAction}
        </p>
      </div>

      {/* Encouragement */}
      <p className="text-center text-sm leading-relaxed text-gray-500 max-w-xs">
        {insight.encouragement}
      </p>

      <RuleDerivedLabel />
    </div>
  )
}
