import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PatientSnapshot, AuditResult, Pillar } from '../types/index'
import type { ExtractionResult } from '../types/vision.ts'
import type { PatientTimeline } from '../types/timeline.ts'
import { runAudit } from '../engine/index'
import { prepareLLMContext } from '../engine/prepare-llm-context'
import { DemoModeBadge } from './DemoModeBadge'
import { DisclaimerBanner } from './DisclaimerBanner'
import { PatientForm } from './PatientForm'
import { ImageUpload } from './ImageUpload.tsx'
import { EHRConnectButton } from './EHRConnectButton.tsx'
import { FHIRPatientList } from './FHIRPatientList.tsx'
import { DomainSelector } from './DomainSelector.tsx'
import { GDMTScore } from './GDMTScore'
import { PillarDashboard } from './PillarDashboard'
import { DetailPanel } from './DetailPanel'
import { ExportButton } from './ExportButton'
import { InertiaActionPlan } from './InertiaActionPlan.tsx'
import { PatientTimelineView } from './PatientTimelineView.tsx'
import { Mascot } from './Mascot.tsx'
import { MascotRestoreButton } from './MascotRestoreButton.tsx'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'
import { useFHIRConnect } from '../hooks/useFHIRConnect.ts'
import { useMascotState } from '../hooks/useMascotState.ts'
import { generateActionPlan } from '../engine/generate-action-plan.ts'

function ResultsEmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {t('dashboard.readyToAudit')}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        {t('dashboard.readyToAuditDesc')}
      </p>
    </div>
  )
}

export function Dashboard() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [currentPatient, setCurrentPatient] = useState<PatientSnapshot | null>(null)
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [dataSource, setDataSource] = useState<'manual' | 'fhir' | 'vision'>('manual')
  const [currentTimeline, setCurrentTimeline] = useState<PatientTimeline | null>(null)
  const fhir = useFHIRConnect()

  const llmContext = useMemo(
    () => (auditResult ? prepareLLMContext(auditResult) : null),
    [auditResult],
  )

  const actions = useMemo(
    () => (auditResult ? generateActionPlan(auditResult) : []),
    [auditResult],
  )

  const mascot = useMascotState(auditResult, isLoading, actions.length)

  const handleAudit = useCallback((patient: PatientSnapshot, timeline?: PatientTimeline) => {
    setIsLoading(true)
    const result = runAudit(patient)
    setAuditResult(result)
    setCurrentPatient(patient)
    setCurrentTimeline(timeline ?? null)
    setSelectedPillar(null)
    setIsLoading(false)
  }, [])

  const handleExtracted = useCallback((result: ExtractionResult) => {
    setExtractionResult(result)
    setDataSource('vision')
  }, [])

  const handleFHIRSelect = useCallback(async (patientId: string) => {
    const snapshot = await fhir.selectPatient(patientId)
    if (snapshot) {
      setDataSource('fhir')
      handleAudit(snapshot)
    }
  }, [fhir.selectPatient, handleAudit])

  const hasResults = auditResult !== null

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <DemoModeBadge />
      <div className="fixed top-2 right-2 z-50"><LanguageSwitcher /></div>
      <DisclaimerBanner />

      <div className="flex min-h-[calc(100vh-2.5rem)] pt-12 px-5 gap-5 max-w-[1920px] mx-auto">
        {/* Left pane — Image Upload + Patient Form */}
        <div className={`flex-shrink-0 transition-all duration-300 ${hasResults ? 'w-[32%]' : 'w-[38%]'}`}>
          <div className="sticky top-14 max-h-[calc(100vh-4rem)] overflow-y-auto form-scroll pr-1 pb-4">
            <EHRConnectButton onClick={fhir.open} dataSource={dataSource} />
            <ImageUpload onExtracted={handleExtracted} />
            <DomainSelector selectedDomainId="hf-gdmt" />
            <PatientForm
              onSubmit={handleAudit}
              isLoading={isLoading}
              extractionResult={extractionResult}
              onTimelineSelect={setCurrentTimeline}
            />
          </div>
        </div>

        {/* Center pane — Score + Action Plan + Pillar Cards */}
        <div className={`flex-shrink-0 transition-all duration-300 ${hasResults ? 'w-[38%]' : 'w-[32%]'}`}>
          <div className="sticky top-14 max-h-[calc(100vh-4rem)] overflow-y-auto pr-1 pb-4">
            {hasResults ? (
              <div className="py-2">
                <div className="flex items-center justify-between">
                  <GDMTScore
                    score={auditResult.gdmtScore}
                    efCategory={auditResult.efCategory}
                  />
                  {currentPatient && (
                    <ExportButton
                      auditResult={auditResult}
                      patient={currentPatient}
                    />
                  )}
                </div>
                <div className="mt-4">
                  <InertiaActionPlan auditResult={auditResult} llmContext={llmContext} />
                </div>
                <div className="mt-4">
                  <PillarDashboard
                    results={auditResult.pillarResults}
                    selectedPillar={selectedPillar}
                    onSelectPillar={setSelectedPillar}
                  />
                </div>
              </div>
            ) : (
              <ResultsEmptyState />
            )}
          </div>
        </div>

        {/* Right pane — Detail Panel + Timeline */}
        <div className="w-[30%] flex-shrink-0">
          <div className="sticky top-14 max-h-[calc(100vh-4rem)] overflow-y-auto pr-1 pb-4">
            <DetailPanel
              auditResult={auditResult}
              selectedPillar={selectedPillar}
              medications={currentPatient?.medications}
            />
            {currentTimeline && (
              <div className="mt-4">
                <PatientTimelineView timeline={currentTimeline} />
              </div>
            )}
          </div>
        </div>
      </div>

      <FHIRPatientList
        isOpen={fhir.isOpen}
        patients={fhir.patients}
        isLoading={fhir.isLoading}
        error={fhir.error}
        selectedPatientId={fhir.selectedPatientId}
        onSelect={handleFHIRSelect}
        onClose={fhir.close}
      />

      {mascot.isVisible ? (
        <Mascot
          emotion={mascot.emotion}
          isVisible={mascot.isVisible}
          onHoverChange={mascot.setHovered}
          onDismiss={mascot.dismiss}
        />
      ) : (
        <MascotRestoreButton onClick={mascot.restore} />
      )}
    </div>
  )
}
