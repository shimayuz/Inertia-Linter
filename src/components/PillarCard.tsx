import { PILLAR_LABELS, type PillarStatus } from '../types/pillar'
import { DOSE_TIER_LABELS } from '../types/dose-tier'
import { BlockerLabel } from './labels/BlockerLabel'
import type { PillarResult } from '../types/audit'

interface PillarCardProps {
  readonly result: PillarResult
  readonly isSelected?: boolean
  readonly onClick?: () => void
}

const STATUS_STYLES: Readonly<Record<PillarStatus, string>> = {
  ON_TARGET: 'bg-green-100 text-green-800 border-green-300',
  UNDERDOSED: 'bg-amber-100 text-amber-800 border-amber-300',
  MISSING: 'bg-red-100 text-red-800 border-red-300',
  CONTRAINDICATED: 'bg-gray-200 text-gray-600 border-gray-400',
  UNKNOWN: 'bg-purple-100 text-purple-800 border-purple-300',
}

const STATUS_DISPLAY_LABELS: Readonly<Record<PillarStatus, string>> = {
  ON_TARGET: 'On Target',
  UNDERDOSED: 'Underdosed',
  MISSING: 'Missing',
  CONTRAINDICATED: 'Contraindicated',
  UNKNOWN: 'Unknown',
}

export function PillarCard({ result, isSelected = false, onClick }: PillarCardProps) {
  const { pillar, status, doseTier, blockers } = result
  const pillarLabel = PILLAR_LABELS[pillar]
  const statusStyle = STATUS_STYLES[status]
  const statusLabel = STATUS_DISPLAY_LABELS[status]
  const showDoseTier = doseTier !== 'NOT_PRESCRIBED'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border shadow-sm p-4 transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-400' : 'border-gray-200'
      }`}
      aria-label={`${pillarLabel} pillar: ${statusLabel}`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-gray-900">{pillarLabel}</h3>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}
          aria-label={`Status: ${statusLabel}`}
        >
          {statusLabel}
        </span>
      </div>

      {showDoseTier && (
        <p className="mt-2 text-sm text-gray-600">
          {DOSE_TIER_LABELS[doseTier]}
        </p>
      )}

      {blockers.length > 0 && (
        <ul className="mt-3 space-y-1" aria-label="Blockers">
          {blockers.map((code) => (
            <li key={code} className="flex items-start gap-1.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
              <BlockerLabel code={code} className="text-gray-700" />
            </li>
          ))}
        </ul>
      )}
    </button>
  )
}
