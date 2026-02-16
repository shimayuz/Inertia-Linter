import { useState, useCallback, useMemo } from 'react'
import type { BlockerCode } from '../types/blocker.ts'
import type { Pillar } from '../types/pillar.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { AuditResult } from '../types/audit.ts'
import type {
  ResolutionPathway,
  ResolutionRecord,
  ResolutionEvent,
  PAFormData,
  GeneratedDocument,
  MedicationAlternative,
  AssistanceProgram,
} from '../types/resolution.ts'
import { selectResolutionPathways, hasResolvableBlockers } from '../engine/resolve-pathway.ts'
import { generatePAForm } from '../engine/generate-pa-form.ts'
import { generateAppealLetter } from '../engine/generate-appeal-letter.ts'
import { findAlternatives, findAssistancePrograms } from '../engine/find-alternatives.ts'
import {
  advanceResolution,
  createResolutionRecord,
  calculateResolutionProgress,
} from '../engine/resolution-tracker.ts'

export interface ResolutionState {
  readonly activeBlocker: { readonly blockerCode: BlockerCode; readonly pillar: Pillar } | null
  readonly pathways: ReadonlyArray<ResolutionPathway>
  readonly selectedPathwayId: string | null
  readonly resolutionRecords: ReadonlyArray<ResolutionRecord>
  readonly paForm: PAFormData | null
  readonly appealLetter: GeneratedDocument | null
  readonly alternatives: ReadonlyArray<MedicationAlternative>
  readonly assistancePrograms: ReadonlyArray<AssistanceProgram>
  readonly isOpen: boolean
}

export interface UseResolutionReturn {
  readonly state: ResolutionState
  readonly openResolution: (blockerCode: BlockerCode, pillar: Pillar) => void
  readonly closeResolution: () => void
  readonly selectPathway: (pathwayId: string) => void
  readonly startResolution: (pathwayId: string) => void
  readonly advanceStep: (recordId: string, event: ResolutionEvent) => void
  readonly generatePA: (pillar: Pillar) => void
  readonly generateAppeal: (denialReason?: string) => void
  readonly getRecordForPillar: (pillar: Pillar) => ResolutionRecord | undefined
  readonly getProgressForPillar: (pillar: Pillar) => { completedSteps: number; totalSteps: number; percentComplete: number } | null
  readonly hasResolvable: (blockers: ReadonlyArray<BlockerCode>) => boolean
}

const INITIAL_STATE: ResolutionState = {
  activeBlocker: null,
  pathways: [],
  selectedPathwayId: null,
  resolutionRecords: [],
  paForm: null,
  appealLetter: null,
  alternatives: [],
  assistancePrograms: [],
  isOpen: false,
}

export function useResolution(
  snapshot: PatientSnapshot | null,
  auditResult: AuditResult | null,
): UseResolutionReturn {
  const [state, setState] = useState<ResolutionState>(INITIAL_STATE)

  const openResolution = useCallback(
    (blockerCode: BlockerCode, pillar: Pillar) => {
      if (!snapshot || !auditResult) return

      const pathways = selectResolutionPathways(blockerCode, pillar, snapshot, auditResult)
      const medication = snapshot.medications.find((m) => m.pillar === pillar)
      const currentDrug = medication?.name ?? ''
      const alternatives = findAlternatives(pillar, currentDrug, blockerCode)
      const programs = findAssistancePrograms(pillar, currentDrug || pillar)

      setState((prev) => ({
        ...prev,
        activeBlocker: { blockerCode, pillar },
        pathways,
        selectedPathwayId: pathways.length > 0 ? pathways[0].id : null,
        paForm: null,
        appealLetter: null,
        alternatives,
        assistancePrograms: programs,
        isOpen: true,
      }))
    },
    [snapshot, auditResult],
  )

  const closeResolution = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeBlocker: null,
      pathways: [],
      selectedPathwayId: null,
      paForm: null,
      appealLetter: null,
      alternatives: [],
      assistancePrograms: [],
      isOpen: false,
    }))
  }, [])

  const selectPathway = useCallback((pathwayId: string) => {
    setState((prev) => ({ ...prev, selectedPathwayId: pathwayId }))
  }, [])

  const startResolution = useCallback(
    (pathwayId: string) => {
      setState((prev) => {
        const pathway = prev.pathways.find((p) => p.id === pathwayId)
        if (!pathway) return prev

        const record = createResolutionRecord(
          pathwayId,
          pathway.type,
          pathway.blockerCode,
          pathway.pillar,
          pathway.steps.map((s) => s.id),
        )

        const startedRecord = advanceResolution(record, {
          type: 'start',
          timestamp: new Date().toISOString(),
        })

        // Auto-complete automated steps
        let current = startedRecord
        for (const step of pathway.steps) {
          if (step.isAutomated) {
            current = advanceResolution(current, {
              type: 'auto_step_complete',
              stepId: step.id,
              timestamp: new Date().toISOString(),
            })
          } else {
            break
          }
        }

        return {
          ...prev,
          resolutionRecords: [...prev.resolutionRecords.filter((r) => r.pathwayId !== pathwayId), current],
        }
      })
    },
    [],
  )

  const advanceStep = useCallback(
    (recordId: string, event: ResolutionEvent) => {
      setState((prev) => ({
        ...prev,
        resolutionRecords: prev.resolutionRecords.map((r) =>
          r.id === recordId ? advanceResolution(r, event) : r,
        ),
      }))
    },
    [],
  )

  const generatePA = useCallback(
    (pillar: Pillar) => {
      if (!snapshot || !auditResult) return
      const form = generatePAForm(pillar, snapshot, auditResult)
      setState((prev) => ({ ...prev, paForm: form }))
    },
    [snapshot, auditResult],
  )

  const generateAppeal = useCallback(
    (denialReason?: string) => {
      if (!state.paForm) return
      const letter = generateAppealLetter(state.paForm, denialReason)
      setState((prev) => ({ ...prev, appealLetter: letter }))
    },
    [state.paForm],
  )

  const getRecordForPillar = useCallback(
    (pillar: Pillar): ResolutionRecord | undefined => {
      return state.resolutionRecords.find((r) => r.pillar === pillar)
    },
    [state.resolutionRecords],
  )

  const getProgressForPillar = useCallback(
    (pillar: Pillar) => {
      const record = state.resolutionRecords.find((r) => r.pillar === pillar)
      if (!record) return null
      return calculateResolutionProgress(record)
    },
    [state.resolutionRecords],
  )

  const hasResolvable = useMemo(() => hasResolvableBlockers, [])

  return {
    state,
    openResolution,
    closeResolution,
    selectPathway,
    startResolution,
    advanceStep,
    generatePA,
    generateAppeal,
    getRecordForPillar,
    getProgressForPillar,
    hasResolvable,
  }
}
