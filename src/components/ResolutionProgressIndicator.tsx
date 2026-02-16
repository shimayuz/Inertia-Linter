import { useTranslation } from 'react-i18next'

interface ResolutionProgressIndicatorProps {
  readonly status: 'in_progress' | 'completed' | 'none'
  readonly percentComplete?: number
}

export function ResolutionProgressIndicator({ status, percentComplete }: ResolutionProgressIndicatorProps) {
  const { t } = useTranslation()

  if (status === 'none') {
    return null
  }

  if (status === 'completed') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
        aria-label={t('resolution.resolved')}
      >
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        {t('resolution.resolved')}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
      aria-label={t('resolution.inProgress')}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
      {t('resolution.inProgress')}
      {percentComplete !== undefined && percentComplete > 0 && (
        <span className="text-blue-500">({String(percentComplete)}%)</span>
      )}
    </span>
  )
}
