import { useTranslation } from 'react-i18next'

export function DemoModeBadge() {
  const { t } = useTranslation('safety')

  return (
    <div
      role="status"
      aria-label={t('demo.ariaLabel')}
      className="bg-amber-400/90 backdrop-blur-sm text-amber-900 font-bold px-3 py-1 rounded-lg text-xs shadow-md select-none tracking-wide"
    >
      {t('demo.badge')}
    </div>
  )
}
