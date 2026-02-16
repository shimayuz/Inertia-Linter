import { useTranslation } from 'react-i18next'
import type { ClinicalMetric, MetricStatus } from '../types/patient-view.ts'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'

interface ClinicalMetricsCardProps {
  readonly metrics: ReadonlyArray<ClinicalMetric>
}

const STATUS_STYLES: Readonly<Record<MetricStatus, { dot: string; bg: string; text: string }>> = {
  at_target: { dot: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  near_target: { dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  off_target: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  unknown: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500' },
}

function formatValue(metric: ClinicalMetric): string {
  if (metric.value === undefined) {
    return '--'
  }
  if (metric.secondaryValue !== undefined) {
    return `${metric.value}/${metric.secondaryValue}`
  }
  return String(metric.value)
}

function MetricCard({ metric, size }: { readonly metric: ClinicalMetric; readonly size: 'primary' | 'secondary' }) {
  const { t } = useTranslation('clinical')
  const style = STATUS_STYLES[metric.status]
  const isPrimary = size === 'primary'
  // metric.label is a dynamic i18n key (e.g. "metrics.hf.ef") — safe to cast
  const label = String(t(metric.label as 'metrics.hf.ef'))

  return (
    <div
      className={`rounded-xl border p-4 ${style.bg} ${isPrimary ? 'col-span-full' : ''}`}
      role="group"
      aria-label={label}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wide ${isPrimary ? 'text-gray-600' : 'text-gray-500'}`}>
          {label}
        </span>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`${isPrimary ? 'text-3xl' : 'text-xl'} font-bold tabular-nums ${style.text}`}>
          {formatValue(metric)}
        </span>
        <span className="text-xs text-gray-400">{metric.unit}</span>
      </div>
      {metric.target && (
        <p className="mt-1 text-xs text-gray-400">
          {t('clinicalMetrics.target', 'target')}: {metric.target.label}
        </p>
      )}
      {metric.value === undefined && (
        <p className="mt-1 text-xs text-gray-400 italic">
          {t('clinicalMetrics.notAvailable', 'Not available')}
        </p>
      )}
    </div>
  )
}

export function ClinicalMetricsCard({ metrics }: ClinicalMetricsCardProps) {
  const { t } = useTranslation('clinical')

  const primary = metrics.find((m) => m.isPrimary)
  const secondary = metrics.filter((m) => !m.isPrimary)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-400">
        {t('clinicalMetrics.title', 'Your Key Health Numbers')}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {primary && <MetricCard metric={primary} size="primary" />}
        {secondary.map((metric) => (
          <MetricCard key={metric.id} metric={metric} size="secondary" />
        ))}
      </div>

      <div className="mt-4">
        <RuleDerivedLabel />
      </div>
    </div>
  )
}
