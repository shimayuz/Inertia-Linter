import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { BlockerCode } from '../types/blocker.ts'
import type { Pillar } from '../types/pillar.ts'
import { BLOCKER_UI_LABELS } from '../types/blocker.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'
import type { UseResolutionReturn } from '../hooks/useResolution.ts'
import { ResolutionPathwayCard } from './ResolutionPathwayCard.tsx'
import { PAFormPreview } from './PAFormPreview.tsx'
import { AlternativesPanel } from './AlternativesPanel.tsx'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel.tsx'

interface ResolutionPanelProps {
  readonly blockerCode: BlockerCode
  readonly pillar: Pillar
  readonly resolution: UseResolutionReturn
}

export function ResolutionPanel({ blockerCode, pillar, resolution }: ResolutionPanelProps) {
  const { t } = useTranslation()
  const { state, selectPathway, startResolution, generatePA, generateAppeal, closeResolution } = resolution
  const { pathways, paForm, appealLetter, alternatives, assistancePrograms, selectedPathwayId, resolutionRecords } = state

  const pillarLabel = PILLAR_LABELS[pillar]
  const blockerLabel = BLOCKER_UI_LABELS[blockerCode]

  const handleStart = useCallback(
    (pathwayId: string) => {
      startResolution(pathwayId)
      generatePA(pillar)
    },
    [startResolution, generatePA, pillar],
  )

  const handleGenerateAppeal = useCallback(() => {
    generateAppeal()
  }, [generateAppeal])

  const handleSwitchTo = useCallback(
    (drugName: string) => {
      const genericPathway = pathways.find(
        (p) => p.type === 'generic_switch' || p.type === 'therapeutic_alternative',
      )
      if (genericPathway) {
        startResolution(genericPathway.id)
      }
      // drugName used for tracking context; switch is handled via pathway
      void drugName
    },
    [pathways, startResolution],
  )

  if (pathways.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/20 overflow-hidden">
      <div className="flex items-center justify-between border-b border-teal-100 bg-teal-50/50 px-4 py-2">
        <div>
          <h4 className="text-sm font-semibold text-teal-800">
            {t('resolution.panelTitle')}: {pillarLabel}
          </h4>
          <p className="text-xs text-teal-600">{blockerLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <RuleDerivedLabel />
          <button
            type="button"
            onClick={closeResolution}
            className="rounded p-1 text-teal-400 hover:bg-teal-100 hover:text-teal-600"
            aria-label="Close resolution panel"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {pathways.map((pathway, index) => {
          const isStarted = resolutionRecords.some((r) => r.pathwayId === pathway.id)
          return (
            <ResolutionPathwayCard
              key={pathway.id}
              pathway={pathway}
              isPrimary={index === 0}
              isStarted={isStarted}
              onSelect={selectPathway}
              onStart={handleStart}
            />
          )
        })}

        {paForm && (
          <PAFormPreview
            paForm={paForm}
            onApprove={() => handleStart(selectedPathwayId ?? pathways[0].id)}
            onGenerateAppeal={handleGenerateAppeal}
          />
        )}

        {appealLetter && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <h5 className="text-sm font-semibold text-blue-800">{t('resolution.appealLetter')}</h5>
            </div>
            <div className="rounded bg-white p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {appealLetter.content}
            </div>
          </div>
        )}

        <AlternativesPanel
          alternatives={alternatives}
          assistancePrograms={assistancePrograms}
          onSwitchTo={handleSwitchTo}
        />
      </div>
    </div>
  )
}
