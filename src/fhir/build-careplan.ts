import type { PreVisitNote, MedicationPlan } from '../types/pre-visit-note.ts'

// ---------------------------------------------------------------------------
// FHIR R4 CarePlan types
// ---------------------------------------------------------------------------

export interface FHIRCarePlan {
  readonly resourceType: 'CarePlan'
  readonly status: 'draft'
  readonly intent: 'plan'
  readonly title: string
  readonly description: string
  readonly created: string
  readonly activity: ReadonlyArray<{
    readonly detail: {
      readonly kind: 'MedicationRequest'
      readonly status: 'not-started' | 'scheduled'
      readonly description: string
      readonly code?: { readonly text: string }
    }
  }>
  readonly note: ReadonlyArray<{
    readonly text: string
  }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapActivityStatus(
  plan: MedicationPlan,
): 'not-started' | 'scheduled' {
  return plan.changeType === 'INITIATE' ? 'not-started' : 'scheduled'
}

function buildActivityDescription(plan: MedicationPlan): string {
  if (plan.changeType === 'INITIATE') {
    return `Initiate ${plan.drugName} at ${plan.targetDose} dose`
  }
  return `Uptitrate ${plan.drugName} from ${plan.currentDose} to ${plan.targetDose} dose`
}

function buildActivity(plan: MedicationPlan): FHIRCarePlan['activity'][number] {
  return {
    detail: {
      kind: 'MedicationRequest',
      status: mapActivityStatus(plan),
      description: buildActivityDescription(plan),
      code: { text: plan.drugName },
    },
  }
}

function buildNote(text: string): FHIRCarePlan['note'][number] {
  return { text }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function buildFHIRCarePlan(note: PreVisitNote): FHIRCarePlan {
  const activities = note.medicationPlans.map(buildActivity)

  const notes: Array<FHIRCarePlan['note'][number]> = []

  for (const explanation of note.patientExplanations) {
    notes.push(
      buildNote(
        `[Patient Explanation - ${explanation.drugName}] ${explanation.explanation}`,
      ),
    )
  }

  for (const deferred of note.deferredItems) {
    notes.push(
      buildNote(`[Deferred - ${deferred.pillar}] ${deferred.reason}`),
    )
  }

  if (note.resolutionTasks && note.resolutionTasks.length > 0) {
    for (const task of note.resolutionTasks) {
      notes.push(
        buildNote(
          `[Resolution - ${task.pillar}] ${task.type}: ${task.description} (${task.status})`,
        ),
      )
    }
  }

  if (note.nextVisitMonitoring.length > 0) {
    notes.push(
      buildNote(
        `[Monitoring] ${note.nextVisitMonitoring.join(', ')}`,
      ),
    )
  }

  return {
    resourceType: 'CarePlan',
    status: 'draft',
    intent: 'plan',
    title: `[DRAFT] GDMT Pre-Visit Plan - ${note.efCategory} - Score ${String(note.gdmtScore)}/100`,
    description: `GDMT optimization plan generated ${note.generatedAt}. This is a DRAFT document and does not constitute a clinical order.`,
    created: note.generatedAt,
    activity: activities,
    note: notes,
  }
}
