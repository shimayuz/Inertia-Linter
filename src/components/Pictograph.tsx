import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface PictographProps {
  readonly benefitCount: number
  readonly harmCount: number
  readonly total?: number
  readonly benefitLabel: string
  readonly harmLabel: string
  readonly trialSource: string
  readonly disclaimer: string
}

type IconColor = 'benefit' | 'harm' | 'neutral'

function getIconColor(index: number, benefitCount: number, harmCount: number): IconColor {
  if (index < benefitCount) return 'benefit'
  if (index < benefitCount + harmCount) return 'harm'
  return 'neutral'
}

const COLOR_CLASSES: Readonly<Record<IconColor, string>> = {
  benefit: 'text-green-600',
  harm: 'text-red-500',
  neutral: 'text-gray-300',
}

function PersonIcon({ color }: { readonly color: IconColor }) {
  return (
    <svg
      className={`w-5 h-5 ${COLOR_CLASSES[color]}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M12 13c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
    </svg>
  )
}

function buildIconColors(
  total: number,
  benefitCount: number,
  harmCount: number,
): ReadonlyArray<IconColor> {
  return Array.from({ length: total }, (_, i) =>
    getIconColor(i, benefitCount, harmCount),
  )
}

export function Pictograph({
  benefitCount,
  harmCount,
  total = 100,
  benefitLabel,
  harmLabel,
  trialSource,
  disclaimer,
}: PictographProps) {
  const icons = buildIconColors(total, benefitCount, harmCount)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">
        Benefit / Risk Pictograph
      </h4>

      <div
        className="grid grid-cols-10 gap-0.5"
        role="img"
        aria-label={`Out of ${total} people: ${benefitCount} benefit (${benefitLabel}), ${harmCount} harm (${harmLabel})`}
      >
        {icons.map((color, i) => (
          <PersonIcon key={i} color={color} />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-600" />
          {benefitLabel} ({benefitCount}/{total})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
          {harmLabel} ({harmCount}/{total})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-300" />
          No event ({total - benefitCount - harmCount}/{total})
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Source: {trialSource}
      </p>

      <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
        {disclaimer}
      </p>

      <RuleDerivedLabel />
    </div>
  )
}
