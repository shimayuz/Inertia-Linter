import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Pillar, BlockerCode } from '../types'
import type { BarrierInfo } from '../types/inertia-buster'
import { getInertiaInfo } from '../engine/get-inertia-info'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface InertiaBusterProps {
  readonly pillar: Pillar
  readonly blockerCodes: ReadonlyArray<BlockerCode>
}

function BarrierCard({ barrier }: { readonly barrier: BarrierInfo }) {
  const { t } = useTranslation('ui')
  const [expanded, setExpanded] = useState(false)

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={toggle}
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-gray-800">
          {barrier.title}
        </span>
        <span
          className="ml-2 text-gray-500 shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          &#9660;
        </span>
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-3 text-sm">
          <div>
            <h5 className="font-semibold text-gray-700 mb-1">{t('buster.information')}</h5>
            <ul className="space-y-1">
              {barrier.information.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-gray-700 mb-1">
              {t('buster.practicalOptions')}
            </h5>
            <ul className="space-y-1">
              {barrier.practicalOptions.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-amber-700 mb-1">
              {t('buster.whenNotApply')}
            </h5>
            <ul className="space-y-1">
              {barrier.whenNotTo.map((item) => (
                <li key={item} className="flex items-start gap-2 text-amber-700">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-400">
            {t('buster.evidence', { source: barrier.evidenceSource })}
          </p>
        </div>
      )}
    </div>
  )
}

export function InertiaBuster({ pillar, blockerCodes }: InertiaBusterProps) {
  const { t } = useTranslation('ui')
  const barriers = getInertiaInfo(pillar, blockerCodes)

  if (barriers.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          {t('buster.title')}
        </h4>
        <RuleDerivedLabel />
      </div>

      <div className="space-y-2">
        {barriers.map((barrier) => (
          <BarrierCard key={barrier.blockerId} barrier={barrier} />
        ))}
      </div>

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
        {barriers[0].disclaimer}
      </p>
    </div>
  )
}
