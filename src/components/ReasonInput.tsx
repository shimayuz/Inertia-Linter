import { useState, useCallback } from 'react'
import type { Pillar, BlockerCode } from '../types'
import { BLOCKER_UI_LABELS } from '../types/blocker'

interface ReasonInputProps {
  readonly pillar: Pillar
  readonly currentBlockers: ReadonlyArray<BlockerCode>
  readonly onReasonsChange: (reasons: ReadonlyArray<BlockerCode>) => void
}

const PREDEFINED_REASONS: ReadonlyArray<{
  readonly code: BlockerCode
  readonly pillars: ReadonlyArray<Pillar>
}> = [
  { code: 'BP_LOW', pillars: ['ARNI_ACEi_ARB', 'BETA_BLOCKER', 'SGLT2i'] },
  { code: 'HR_LOW', pillars: ['BETA_BLOCKER'] },
  { code: 'K_HIGH', pillars: ['MRA', 'ARNI_ACEi_ARB'] },
  {
    code: 'EGFR_LOW_INIT',
    pillars: ['SGLT2i', 'MRA', 'ARNI_ACEi_ARB'],
  },
  {
    code: 'EGFR_LOW_CONT',
    pillars: ['SGLT2i', 'MRA', 'ARNI_ACEi_ARB'],
  },
  { code: 'RECENT_AKI', pillars: ['SGLT2i', 'MRA', 'ARNI_ACEi_ARB'] },
  {
    code: 'ADR_HISTORY',
    pillars: ['ARNI_ACEi_ARB', 'BETA_BLOCKER', 'MRA', 'SGLT2i'],
  },
  {
    code: 'ALLERGY',
    pillars: ['ARNI_ACEi_ARB', 'BETA_BLOCKER', 'MRA', 'SGLT2i'],
  },
  {
    code: 'PATIENT_REFUSAL',
    pillars: ['ARNI_ACEi_ARB', 'BETA_BLOCKER', 'MRA', 'SGLT2i'],
  },
  {
    code: 'COST_BARRIER',
    pillars: ['ARNI_ACEi_ARB', 'BETA_BLOCKER', 'MRA', 'SGLT2i'],
  },
]

function getAvailableReasons(
  pillar: Pillar,
  currentBlockers: ReadonlyArray<BlockerCode>,
): ReadonlyArray<BlockerCode> {
  return PREDEFINED_REASONS
    .filter(
      (reason) =>
        reason.pillars.includes(pillar) &&
        !currentBlockers.includes(reason.code),
    )
    .map((reason) => reason.code)
}

export function ReasonInput({
  pillar,
  currentBlockers,
  onReasonsChange,
}: ReasonInputProps) {
  const [selectedReasons, setSelectedReasons] = useState<
    ReadonlyArray<BlockerCode>
  >([])
  const [otherText, setOtherText] = useState('')

  const availableReasons = getAvailableReasons(pillar, currentBlockers)

  const handleToggle = useCallback(
    (code: BlockerCode) => {
      const next = selectedReasons.includes(code)
        ? selectedReasons.filter((r) => r !== code)
        : [...selectedReasons, code]
      setSelectedReasons(next)
      onReasonsChange(next)
    },
    [selectedReasons, onReasonsChange],
  )

  const handleOtherChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setOtherText(e.target.value)
      if (e.target.value.trim() && !selectedReasons.includes('OTHER')) {
        const next = [...selectedReasons, 'OTHER' as BlockerCode]
        setSelectedReasons(next)
        onReasonsChange(next)
      } else if (
        !e.target.value.trim() &&
        selectedReasons.includes('OTHER')
      ) {
        const next = selectedReasons.filter((r) => r !== 'OTHER')
        setSelectedReasons(next)
        onReasonsChange(next)
      }
    },
    [selectedReasons, onReasonsChange],
  )

  if (availableReasons.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700">
        Add Undocumented Reason (Optional)
      </h4>
      <p className="text-xs text-gray-500">
        If there is a clinical reason not captured in the structured data, select
        it below.
      </p>
      <div className="space-y-1.5">
        {availableReasons.map((code) => (
          <label
            key={code}
            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedReasons.includes(code)}
              onChange={() => handleToggle(code)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {BLOCKER_UI_LABELS[code]}
          </label>
        ))}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedReasons.includes('OTHER')}
              onChange={() => handleToggle('OTHER')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Other:
          </label>
          <input
            type="text"
            value={otherText}
            onChange={handleOtherChange}
            placeholder="Describe reason..."
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
