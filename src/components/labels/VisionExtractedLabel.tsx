import { useTranslation } from 'react-i18next'

interface VisionExtractedLabelProps {
  readonly className?: string
}

export function VisionExtractedLabel({ className = '' }: VisionExtractedLabelProps) {
  const { t } = useTranslation('safety')

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800 ${className}`}
      aria-label={t('label.visionExtractedAria')}
    >
      {t('label.visionExtracted')}
    </span>
  )
}
