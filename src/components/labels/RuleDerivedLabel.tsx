import { useTranslation } from 'react-i18next'

interface RuleDerivedLabelProps {
  readonly className?: string
}

export function RuleDerivedLabel({ className = '' }: RuleDerivedLabelProps) {
  const { t } = useTranslation('safety')

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ${className}`}
      aria-label={t('label.ruleDerivedAria')}
    >
      {t('label.ruleDerived')}
    </span>
  )
}
