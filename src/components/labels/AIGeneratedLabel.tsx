import { useTranslation } from 'react-i18next'

interface AIGeneratedLabelProps {
  readonly className?: string
}

export function AIGeneratedLabel({ className = '' }: AIGeneratedLabelProps) {
  const { t } = useTranslation('safety')

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 ${className}`}
      aria-label={t('label.aiGeneratedAria')}
    >
      {t('label.aiGenerated')}
    </span>
  )
}
