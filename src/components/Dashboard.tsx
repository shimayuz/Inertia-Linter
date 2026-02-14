import { useState, useMemo } from 'react'
import type { PatientSnapshot, AuditResult, Pillar } from '../types/index'
import { runAudit } from '../engine/index'
import { prepareLLMContext } from '../engine/prepare-llm-context'
import { DemoModeBadge } from './DemoModeBadge'
import { DisclaimerBanner } from './DisclaimerBanner'
import { PatientForm } from './PatientForm'
import { GDMTScore } from './GDMTScore'
import { PillarDashboard } from './PillarDashboard'
import { DetailPanel } from './DetailPanel'
import { ExportButton } from './ExportButton'
import { LLMExplanation } from './LLMExplanation'

export function Dashboard() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [currentPatient, setCurrentPatient] = useState<PatientSnapshot | null>(null)
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const llmContext = useMemo(
    () => (auditResult ? prepareLLMContext(auditResult) : null),
    [auditResult],
  )

  const handleAudit = (patient: PatientSnapshot) => {
    setIsLoading(true)
    const result = runAudit(patient)
    setAuditResult(result)
    setCurrentPatient(patient)
    setSelectedPillar(null)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoModeBadge />
      <DisclaimerBanner />
      <div className="flex min-h-screen pt-12 px-4 gap-4">
        {/* Left pane 25% — Patient Form */}
        <div className="w-1/4 flex-shrink-0">
          <PatientForm onSubmit={handleAudit} isLoading={isLoading} />
        </div>
        {/* Center pane 45% — Score + Pillar Cards */}
        <div className="w-[45%] flex-shrink-0">
          {auditResult && (
            <>
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
                <LLMExplanation context={llmContext} />
              </div>
              <div className="mt-6">
                <PillarDashboard
                  results={auditResult.pillarResults}
                  selectedPillar={selectedPillar}
                  onSelectPillar={setSelectedPillar}
                />
              </div>
            </>
          )}
        </div>
        {/* Right pane 30% — Detail Panel */}
        <div className="w-[30%] flex-shrink-0">
          <DetailPanel
            auditResult={auditResult}
            selectedPillar={selectedPillar}
          />
        </div>
      </div>
    </div>
  )
}
