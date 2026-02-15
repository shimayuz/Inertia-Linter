import { useTranslation } from 'react-i18next'

export function DisclaimerBanner() {
  const { t } = useTranslation('safety')

  return (
    <div
      role="banner"
      aria-label={t('disclaimer.ariaLabel')}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 text-gray-500 text-center text-xs py-2 px-4 tracking-wide"
    >
      {t('disclaimer.banner')}
    </div>
  )
}
