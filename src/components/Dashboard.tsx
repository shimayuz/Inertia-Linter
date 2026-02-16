import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PatientSnapshot, AuditResult, Pillar } from '../types/index'
import type { ExtractionResult } from '../types/vision.ts'
import type { PatientTimeline } from '../types/timeline.ts'
import { runAudit } from '../engine/index'
import { getDomain } from '../domains/registry'
import { prepareLLMContext } from '../engine/prepare-llm-context'
import { fetchPatientEverything } from '../fhir/fhir-client.ts'
import { fhirToSnapshot } from '../fhir/fhir-to-snapshot.ts'
import { getDemoAppointments, getEhrAppointments, getDemoCaseData } from '../data/mock-appointments.ts'
import type { AppointmentPatient } from '../types/appointment.ts'
import { AppHeader } from './AppHeader'
import { DisclaimerBanner } from './DisclaimerBanner'
import { PatientForm } from './PatientForm'
import { ImageUpload } from './ImageUpload.tsx'
import { PatientListSidebar } from './PatientListSidebar.tsx'
import { GDMTScore } from './GDMTScore'
import { PillarDashboard } from './PillarDashboard'
import { DetailPanel } from './DetailPanel'
import { ExportButton } from './ExportButton'
import { PatientSummaryBar } from './PatientSummaryBar.tsx'
import { StickyScoreBar } from './StickyScoreBar.tsx'
import { FloatingActionPanel } from './FloatingActionPanel.tsx'
import { PatientTimelineView } from './PatientTimelineView.tsx'
import { Mascot } from './Mascot.tsx'
import { MascotRestoreButton } from './MascotRestoreButton.tsx'
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
  const [currentTimeline, setCurrentTimeline] = useState<PatientTimeline | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [sidebarLoading, setSidebarLoading] = useState(false)
  const [preloadedPatient, setPreloadedPatient] = useState<PatientSnapshot | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFormCollapsed, setIsFormCollapsed] = useState(false)
  const [isEhrConnected, setIsEhrConnected] = useState(false)
  const [isEhrConnecting, setIsEhrConnecting] = useState(false)
  const [ehrPatients, setEhrPatients] = useState<ReadonlyArray<AppointmentPatient>>([])

  const demoAppointments = useMemo(() => getDemoAppointments(), [])
  const appointments = useMemo(
    () => (isEhrConnected ? [...demoAppointments, ...ehrPatients] : demoAppointments),
    [demoAppointments, ehrPatients, isEhrConnected],
  )

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

    let result
    const domainId = patient.domainId
    if (domainId) {
      const domain = getDomain(domainId)
      if (domain && domain.status === 'active') {
        result = domain.runAudit(patient)
      } else {
        result = runAudit(patient)
      }
    } else {
      result = runAudit(patient)
    }

    setAuditResult(result)
    setCurrentPatient(patient)
    setCurrentTimeline(timeline ?? null)
    setSelectedPillar(null)
    setIsLoading(false)
    setIsFormCollapsed(true)
  }, [])

  const handleExtracted = useCallback((result: ExtractionResult) => {
    setExtractionResult(result)

    setShowImageUpload(false)
  }, [])

  const handleSelectPatient = useCallback(async (patientId: string) => {
    setSelectedPatientId(patientId)
    setSidebarLoading(true)

    const demoData = getDemoCaseData(patientId)
    if (demoData) {
      setPreloadedPatient(demoData.snapshot)
      setCurrentTimeline(demoData.timeline)

      handleAudit(demoData.snapshot, demoData.timeline)
      setSidebarLoading(false)
      return
    }

    try {
      const bundle = await fetchPatientEverything(patientId)
      const snapshot = fhirToSnapshot(bundle)
      setPreloadedPatient(snapshot)

      handleAudit(snapshot)
    } catch {
      setPreloadedPatient(null)
    }
    setSidebarLoading(false)
  }, [handleAudit])

  const handleManualEntry = useCallback(() => {
    setSelectedPatientId(null)
    setPreloadedPatient(null)
    setAuditResult(null)
    setCurrentPatient(null)
    setCurrentTimeline(null)
    setExtractionResult(null)
    setIsFormCollapsed(false)
  }, [])

  const handleEditPatient = useCallback(() => {
    setIsFormCollapsed(false)
  }, [])

  const handleToggleImageUpload = useCallback(() => {
    setShowImageUpload((prev) => !prev)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleConnectEhr = useCallback(() => {
    setIsEhrConnecting(true)
    // Simulate async EHR connection (real: OAuth + FHIR endpoint discovery)
    setTimeout(() => {
      const patients = getEhrAppointments()
      setEhrPatients(patients)
      setIsEhrConnected(true)
      setIsEhrConnecting(false)
    }, 800)
  }, [])

  const hasResults = auditResult !== null

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AppHeader isSidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
      <DisclaimerBanner />

      <div className="flex min-h-[calc(100vh-2.5rem)] pt-14 max-w-[1920px] mx-auto">
        {/* Left pane — Patient List Sidebar (toggleable) */}
        {sidebarOpen && (
          <div className="w-[20%] min-w-[240px] max-w-[300px] flex-shrink-0 border-r border-gray-200 bg-white animate-slide-in">
            <div className="sticky top-14 max-h-[calc(100vh-4rem)] overflow-y-auto form-scroll">
              <PatientListSidebar
                appointments={appointments}
                selectedId={selectedPatientId}
                isLoading={sidebarLoading}
                onSelectPatient={handleSelectPatient}
                onManualEntry={handleManualEntry}
                onImageUpload={handleToggleImageUpload}
                isEhrConnected={isEhrConnected}
                isEhrConnecting={isEhrConnecting}
                onConnectEhr={handleConnectEhr}
              />
            </div>
          </div>
        )}

        {/* Center pane — Form + Results */}
        <div className="flex-1 min-w-0 px-5">
          <div className="sticky top-14 max-h-[calc(100vh-4rem)] overflow-y-auto form-scroll pr-1 pb-4">
            {isFormCollapsed && currentPatient ? (
              <>
                <PatientSummaryBar patient={currentPatient} onEdit={handleEditPatient} />
                {auditResult && (
                  <>
                    <StickyScoreBar
                      score={auditResult.gdmtScore}
                      efCategory={auditResult.efCategory}
                      auditResult={auditResult}
                      patient={currentPatient}
                    />
                    <div className="mt-4">
                      <PillarDashboard
                        results={auditResult.pillarResults}
                        selectedPillar={selectedPillar}
                        onSelectPillar={setSelectedPillar}
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {showImageUpload && (
                  <div className="mb-3">
                    <ImageUpload onExtracted={handleExtracted} />
                  </div>
                )}

                <PatientForm
                  onSubmit={handleAudit}
                  isLoading={isLoading}
                  extractionResult={extractionResult}
                  onTimelineSelect={setCurrentTimeline}
                  preloadedPatient={preloadedPatient}
                />

                {hasResults ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <GDMTScore
                        score={auditResult.gdmtScore}
                        efCategory={auditResult.efCategory}
                        domainId={auditResult.domainId}
                      />
                      {currentPatient && (
                        <ExportButton
                          auditResult={auditResult}
                          patient={currentPatient}
                        />
                      )}
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
              </>
            )}
          </div>
        </div>

        {/* Right pane — Detail Panel + Timeline */}
        <div className="w-[30%] flex-shrink-0 px-5">
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

      {auditResult && actions.length > 0 && (
        <FloatingActionPanel
          auditResult={auditResult}
          llmContext={llmContext}
          medications={currentPatient?.medications}
          snapshot={currentPatient}
          pendingCount={actions.length}
        />
      )}

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
