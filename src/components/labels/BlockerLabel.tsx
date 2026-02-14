import { BLOCKER_UI_LABELS, type BlockerCode } from '../../types/blocker'

const CLINICAL_INERTIA_TOOLTIP =
  'No documented contraindication, data gap, or patient factor was found. If there is an undocumented reason, please add it below.'

interface BlockerLabelProps {
  readonly code: BlockerCode
  readonly className?: string
}

export function BlockerLabel({ code, className = '' }: BlockerLabelProps) {
  const label = BLOCKER_UI_LABELS[code]
  const isClinicalInertia = code === 'CLINICAL_INERTIA'

  return (
    <span
      className={`inline-flex items-center text-sm ${className}`}
      title={isClinicalInertia ? CLINICAL_INERTIA_TOOLTIP : undefined}
      aria-label={
        isClinicalInertia ? `${label}. ${CLINICAL_INERTIA_TOOLTIP}` : label
      }
    >
      {label}
    </span>
  )
}
