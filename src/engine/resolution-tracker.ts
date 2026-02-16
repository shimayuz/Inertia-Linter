import type {
  ResolutionRecord,
  ResolutionEvent,
  ResolutionStatus,
  StepProgress,
} from '../types/resolution.ts'

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Readonly<Record<ResolutionStatus, ReadonlyArray<ResolutionStatus>>> = {
  not_started: ['auto_preparing'],
  auto_preparing: ['clinician_review', 'completed'],
  clinician_review: ['submitted', 'completed', 'abandoned'],
  submitted: ['in_progress', 'approved', 'denied'],
  in_progress: ['approved', 'denied', 'completed'],
  approved: ['completed'],
  denied: ['not_started', 'abandoned'],
  completed: [],
  abandoned: [],
} as const

function canTransition(from: ResolutionStatus, to: ResolutionStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

// ---------------------------------------------------------------------------
// Event -> Status mapping
// ---------------------------------------------------------------------------

function deriveNextStatus(
  current: ResolutionStatus,
  event: ResolutionEvent,
): ResolutionStatus {
  switch (event.type) {
    case 'start':
      return 'auto_preparing'
    case 'auto_step_complete': {
      // If all automated steps done, move to clinician_review
      return 'clinician_review'
    }
    case 'clinician_approve':
      return current === 'clinician_review' ? 'submitted' : 'completed'
    case 'clinician_reject':
      return 'abandoned'
    case 'submit':
      return 'in_progress'
    case 'external_approve':
      return 'approved'
    case 'external_deny':
      return 'denied'
    case 'complete':
      return 'completed'
    case 'abandon':
      return 'abandoned'
    default:
      return current
  }
}

// ---------------------------------------------------------------------------
// Step progress advancement
// ---------------------------------------------------------------------------

function advanceStepProgress(
  stepProgress: ReadonlyArray<StepProgress>,
  event: ResolutionEvent,
): ReadonlyArray<StepProgress> {
  if (!event.stepId) {
    return stepProgress
  }

  return stepProgress.map((sp) => {
    if (sp.stepId !== event.stepId) {
      return sp
    }

    if (event.type === 'auto_step_complete') {
      return {
        ...sp,
        status: 'completed' as const,
        completedAt: event.timestamp,
        autoCompleted: true,
      }
    }

    if (event.type === 'clinician_approve') {
      return {
        ...sp,
        status: 'completed' as const,
        completedAt: event.timestamp,
        autoCompleted: false,
      }
    }

    return sp
  })
}

// ---------------------------------------------------------------------------
// Main functions
// ---------------------------------------------------------------------------

export function advanceResolution(
  record: ResolutionRecord,
  event: ResolutionEvent,
): ResolutionRecord {
  const nextStatus = deriveNextStatus(record.status, event)

  if (nextStatus !== record.status && !canTransition(record.status, nextStatus)) {
    // Invalid transition; return unchanged
    return record
  }

  const updatedStepProgress = advanceStepProgress(record.stepProgress, event)

  return {
    ...record,
    status: nextStatus,
    updatedAt: event.timestamp,
    completedAt: nextStatus === 'completed' ? event.timestamp : record.completedAt,
    stepProgress: updatedStepProgress,
  }
}

export function calculateResolutionProgress(
  record: ResolutionRecord,
): { readonly completedSteps: number; readonly totalSteps: number; readonly percentComplete: number } {
  const totalSteps = record.stepProgress.length
  if (totalSteps === 0) {
    return { completedSteps: 0, totalSteps: 0, percentComplete: 0 }
  }

  const completedSteps = record.stepProgress.filter(
    (sp) => sp.status === 'completed' || sp.status === 'skipped',
  ).length

  const percentComplete = Math.round((completedSteps / totalSteps) * 100)

  return { completedSteps, totalSteps, percentComplete }
}

export function createResolutionRecord(
  pathwayId: string,
  pathwayType: ResolutionRecord['pathwayType'],
  blockerCode: ResolutionRecord['blockerCode'],
  pillar: ResolutionRecord['pillar'],
  stepIds: ReadonlyArray<string>,
): ResolutionRecord {
  const now = new Date().toISOString()
  return {
    id: `res-${pathwayId}-${Date.now()}`,
    pathwayId,
    pathwayType,
    blockerCode,
    pillar,
    status: 'not_started',
    startedAt: now,
    updatedAt: now,
    stepProgress: stepIds.map((stepId) => ({
      stepId,
      status: 'pending' as const,
      autoCompleted: false,
    })),
    generatedDocuments: [],
  }
}

export function isResolutionActive(record: ResolutionRecord): boolean {
  return !['completed', 'abandoned'].includes(record.status)
}
