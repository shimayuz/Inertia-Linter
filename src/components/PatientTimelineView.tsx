import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PatientTimeline } from '../types/timeline'
import {
  toScoreProgression,
  toMedicationTimeline,
  toLabTrends,
  generateJourneySummary,
} from '../engine/timeline-transforms'
import { ScoreProgressChart } from './ScoreProgressChart'
import { MedicationTimeline } from './MedicationTimeline'
import { LabTrendChart } from './LabTrendChart'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'
import { DraftWatermark } from './labels/DraftWatermark'

interface PatientTimelineViewProps {
  readonly timeline: PatientTimeline | null
}

type TimelineTab = 'score' | 'medications' | 'labs'

type TabLabelKey = 'timeline.tabScore' | 'timeline.tabMedications' | 'timeline.tabLabs'

const TAB_KEYS: ReadonlyArray<{
  readonly id: TimelineTab
  readonly labelKey: TabLabelKey
}> = [
  { id: 'score', labelKey: 'timeline.tabScore' },
  { id: 'medications', labelKey: 'timeline.tabMedications' },
  { id: 'labs', labelKey: 'timeline.tabLabs' },
]

export function PatientTimelineView({ timeline }: PatientTimelineViewProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TimelineTab>('score')

  const scoreData = useMemo(
    () => (timeline ? toScoreProgression(timeline) : []),
    [timeline],
  )

  const medicationData = useMemo(
    () => (timeline ? toMedicationTimeline(timeline) : []),
    [timeline],
  )

  const labData = useMemo(
    () => (timeline ? toLabTrends(timeline) : []),
    [timeline],
  )

  const journeySummary = useMemo(
    () => (timeline ? generateJourneySummary(timeline) : ''),
    [timeline],
  )

  if (!timeline) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-100 bg-white p-12 shadow-sm">
        <p className="text-sm text-gray-400">
          {t('timeline.noTimeline')}
        </p>
      </div>
    )
  }

  return (
    <DraftWatermark>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {t('timeline.title')}
          </h2>
          <RuleDerivedLabel />
        </div>

        {journeySummary && (
          <div className="border-b border-gray-100 px-6 py-3">
            <p className="text-sm leading-relaxed text-gray-600">
              {journeySummary}
            </p>
          </div>
        )}

        <div className="border-b border-gray-100" role="tablist" aria-label={t('timeline.title')}>
          <div className="flex gap-0 px-6">
            {TAB_KEYS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`timeline-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-6 py-5">
          {activeTab === 'score' && (
            <div
              id="timeline-panel-score"
              role="tabpanel"
              aria-labelledby="timeline-tab-score"
            >
              <ScoreProgressChart data={scoreData} />
            </div>
          )}
          {activeTab === 'medications' && (
            <div
              id="timeline-panel-medications"
              role="tabpanel"
              aria-labelledby="timeline-tab-medications"
            >
              <MedicationTimeline data={medicationData} />
            </div>
          )}
          {activeTab === 'labs' && (
            <div
              id="timeline-panel-labs"
              role="tabpanel"
              aria-labelledby="timeline-tab-labs"
            >
              <LabTrendChart data={labData} />
            </div>
          )}
        </div>
      </div>
    </DraftWatermark>
  )
}
