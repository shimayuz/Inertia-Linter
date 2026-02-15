import { useTranslation } from 'react-i18next'
import { type BlockerCode } from '../../types/blocker'

interface BlockerLabelProps {
  readonly code: BlockerCode
  readonly className?: string
}

export function BlockerLabel({ code, className = '' }: BlockerLabelProps) {
  const { t } = useTranslation('clinical')

  const label = t(`blocker.${code}`)
  const isClinicalInertia = code === 'CLINICAL_INERTIA'
  const tooltip = t('blockerTooltip.CLINICAL_INERTIA')

  return (
    <span
      className={`inline-flex items-center text-sm ${className}`}
      title={isClinicalInertia ? tooltip : undefined}
      aria-label={
        isClinicalInertia ? `${label}. ${tooltip}` : label
      }
    >
      {label}
    </span>
  )
}
