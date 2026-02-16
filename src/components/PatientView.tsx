import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuditResult } from '../types/audit.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { Nudge } from '../types/patient-view.ts'
import { generateNudges } from '../engine/generate-nudges.ts'
import { generateSharedDecisions } from '../engine/generate-shared-decisions.ts'
import { extractClinicalMetrics } from '../engine/extract-clinical-metrics.ts'
import { PatientInsightCard } from './PatientInsightCard.tsx'
import { ClinicalMetricsCard } from './ClinicalMetricsCard.tsx'
import { NudgePanel } from './NudgePanel.tsx'
import { SharedDecisionAid } from './SharedDecisionAid.tsx'
import { DemoModeBadge } from './DemoModeBadge.tsx'
import { DisclaimerBanner } from './DisclaimerBanner.tsx'

interface PatientViewProps {
  readonly auditResult: AuditResult
  readonly patient: PatientSnapshot
}

const TAB_IDS = {
  SCORE: 'score',
  REMINDERS: 'reminders',
  DECISIONS: 'decisions',
} as const

type TabId = typeof TAB_IDS[keyof typeof TAB_IDS]

interface TabConfig {
  readonly id: TabId
  readonly label: string
  readonly icon: ReactNode
}

function ChartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

function ScaleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  )
}

const TABS: ReadonlyArray<TabConfig> = [
  { id: TAB_IDS.SCORE, label: 'My Score', icon: <ChartIcon /> },
  { id: TAB_IDS.REMINDERS, label: 'Reminders', icon: <BellIcon /> },
  { id: TAB_IDS.DECISIONS, label: 'Decisions', icon: <ScaleIcon /> },
]

function updateNudgeStatus(
  nudges: ReadonlyArray<Nudge>,
  id: string,
  status: Nudge['status'],
): ReadonlyArray<Nudge> {
  return nudges.map((nudge) =>
    nudge.id === id
      ? { ...nudge, status }
      : nudge,
  )
}

export function PatientView({ auditResult, patient }: PatientViewProps) {
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState<TabId>(TAB_IDS.SCORE)

  const initialNudges = useMemo(
    () => generateNudges(auditResult, patient),
    [auditResult, patient],
  )

  const [nudges, setNudges] = useState<ReadonlyArray<Nudge>>(initialNudges)

  const clinicalMetrics = useMemo(
    () => extractClinicalMetrics(patient, auditResult.domainId),
    [patient, auditResult.domainId],
  )

  const sharedDecisions = useMemo(
    () => generateSharedDecisions(auditResult),
    [auditResult],
  )

  const handleDismiss = useCallback((id: string) => {
    setNudges((prev) => updateNudgeStatus(prev, id, 'dismissed'))
  }, [])

  const handleAcknowledge = useCallback((id: string) => {
    setNudges((prev) => updateNudgeStatus(prev, id, 'acknowledged'))
  }, [])

  const pendingNudgeCount = nudges.filter((n) => n.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <DisclaimerBanner />

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('patientView.title', 'Your Health Dashboard')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('patientView.subtitle', 'Track your treatment progress and stay informed')}
            </p>
          </div>
          <DemoModeBadge />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6">
        <nav className="flex gap-1" role="tablist" aria-label="Patient dashboard tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const showBadge = tab.id === TAB_IDS.REMINDERS && pendingNudgeCount > 0

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-teal-500 text-teal-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {showBadge && (
                  <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingNudgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab panels */}
      <div className="px-6 py-6">
        {/* My Score tab */}
        <div
          id="tabpanel-score"
          role="tabpanel"
          aria-labelledby="tab-score"
          hidden={activeTab !== TAB_IDS.SCORE}
        >
          {activeTab === TAB_IDS.SCORE && (
            <div className="mx-auto max-w-md space-y-6">
              <PatientInsightCard auditResult={auditResult} />
              <ClinicalMetricsCard metrics={clinicalMetrics} />
            </div>
          )}
        </div>

        {/* Reminders tab */}
        <div
          id="tabpanel-reminders"
          role="tabpanel"
          aria-labelledby="tab-reminders"
          hidden={activeTab !== TAB_IDS.REMINDERS}
        >
          {activeTab === TAB_IDS.REMINDERS && (
            <div className="mx-auto max-w-lg">
              <NudgePanel
                nudges={nudges}
                onDismiss={handleDismiss}
                onAcknowledge={handleAcknowledge}
              />
            </div>
          )}
        </div>

        {/* Decisions tab */}
        <div
          id="tabpanel-decisions"
          role="tabpanel"
          aria-labelledby="tab-decisions"
          hidden={activeTab !== TAB_IDS.DECISIONS}
        >
          {activeTab === TAB_IDS.DECISIONS && (
            <div className="mx-auto max-w-4xl space-y-6">
              {sharedDecisions.length > 0 ? (
                sharedDecisions.map((ctx) => (
                  <SharedDecisionAid key={ctx.pillar} context={ctx} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-100 p-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    No decisions needed right now
                  </h3>
                  <p className="mt-1 text-xs text-gray-400 max-w-xs">
                    Your current treatment plan does not have any areas where new medication decisions are needed. Keep following your care team's guidance.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
