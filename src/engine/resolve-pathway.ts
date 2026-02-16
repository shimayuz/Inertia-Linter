import type { BlockerCode } from '../types/blocker.ts'
import type { Pillar } from '../types/pillar.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { AuditResult } from '../types/audit.ts'
import type { ResolutionPathway, ResolutionStep } from '../types/resolution.ts'
import { BLOCKER_CODE_CATEGORY } from '../types/blocker.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'

// ---------------------------------------------------------------------------
// Resolvable blocker categories
// ---------------------------------------------------------------------------

const RESOLVABLE_CATEGORIES = new Set(['ACCESS', 'TRANSITION', 'PATIENT'])
const RESOLVABLE_OVERRIDES = new Set<BlockerCode>(['PERIOP_HOLD'])

function isResolvableBlocker(blockerCode: BlockerCode): boolean {
  if (RESOLVABLE_OVERRIDES.has(blockerCode)) {
    return true
  }
  const category = BLOCKER_CODE_CATEGORY[blockerCode]
  return RESOLVABLE_CATEGORIES.has(category)
}

// ---------------------------------------------------------------------------
// Step builders
// ---------------------------------------------------------------------------

function makeStep(
  id: string,
  order: number,
  title: string,
  description: string,
  isAutomated: boolean,
  requiresClinicianInput: boolean,
  estimatedSeconds: number,
): ResolutionStep {
  return { id, order, title, description, isAutomated, requiresClinicianInput, estimatedSeconds }
}

// ---------------------------------------------------------------------------
// Pathway builders per blocker
// ---------------------------------------------------------------------------

function buildPADeniedPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-pa_denied`

  return [
    {
      id: `${baseId}-appeal`,
      blockerCode: 'PA_DENIED',
      pillar,
      type: 'pa_appeal',
      title: `${pillarLabel}: PA Appeal`,
      description: `Generate appeal letter with guideline citations for ${pillarLabel} prior authorization denial.`,
      urgency: 'within_visit',
      estimatedTime: '60 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-appeal-s1`, 1, 'Auto-generate appeal letter', 'Pre-fill with diagnosis, guidelines, and prior trials', true, false, 5),
        makeStep(`${baseId}-appeal-s2`, 2, 'Clinician review', 'Review and approve the appeal letter', false, true, 45),
        makeStep(`${baseId}-appeal-s3`, 3, 'Submit appeal', 'Submit to payer via fax', true, false, 10),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-generic-switch`],
    },
    {
      id: `${baseId}-generic-switch`,
      blockerCode: 'PA_DENIED',
      pillar,
      type: 'generic_switch',
      title: `${pillarLabel}: Switch to Generic ACEi`,
      description: `Bridge with generic ACEi ($4/month) while PA appeal is processed.`,
      urgency: 'immediate',
      estimatedTime: '30 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-gs-s1`, 1, 'Select bridge medication', 'Enalapril 2.5mg BID as bridge', true, false, 5),
        makeStep(`${baseId}-gs-s2`, 2, 'Clinician approval', 'One-click approval for bridge prescription', false, true, 15),
        makeStep(`${baseId}-gs-s3`, 3, 'Add to pre-visit note', 'Include bridge prescription in care plan', true, false, 5),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-appeal`],
    },
  ]
}

function buildStepTherapyPathways(
  pillar: Pillar,
  snapshot: PatientSnapshot,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-step_therapy`
  const hasPriorTrial = snapshot.resolutionContext?.priorTrials?.some(
    (t) => t.pillar === pillar && t.outcome === 'tolerated',
  ) ?? false

  const pathways: Array<ResolutionPathway> = [
    {
      id: `${baseId}-bridge`,
      blockerCode: 'STEP_THERAPY_REQUIRED',
      pillar,
      type: 'step_therapy_start',
      title: `${pillarLabel}: ACEi Bridge + Scheduled PA Resubmission`,
      description: `Start ACEi bridge ($4/month, no PA required). Auto-schedule ARNI PA resubmission after 90-day ACEi trial.`,
      urgency: 'immediate',
      estimatedTime: '45 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-b-s1`, 1, 'Generate bridge prescription', 'Enalapril 2.5mg BID', true, false, 5),
        makeStep(`${baseId}-b-s2`, 2, 'Clinician approval', 'Approve ACEi bridge start', false, true, 20),
        makeStep(`${baseId}-b-s3`, 3, 'Schedule PA resubmission', 'Auto-schedule ARNI PA for 90 days from now', true, false, 5),
        makeStep(`${baseId}-b-s4`, 4, 'Pre-generate PA form', 'PA form pre-filled for future submission', true, false, 10),
      ],
      requiredData: [],
      alternativePathwayIds: hasPriorTrial ? [`${baseId}-exception`] : [],
    },
  ]

  if (hasPriorTrial) {
    pathways.push({
      id: `${baseId}-exception`,
      blockerCode: 'STEP_THERAPY_REQUIRED',
      pillar,
      type: 'step_therapy_exception',
      title: `${pillarLabel}: Step Therapy Exception Request`,
      description: `Prior inpatient ${pillarLabel} use documented. Request exception based on established tolerability.`,
      urgency: 'within_visit',
      estimatedTime: '60 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-e-s1`, 1, 'Auto-generate exception request', 'Cite prior tolerated trial as basis', true, false, 5),
        makeStep(`${baseId}-e-s2`, 2, 'Clinician review', 'Review exception request', false, true, 45),
        makeStep(`${baseId}-e-s3`, 3, 'Submit exception', 'Submit to payer', true, false, 10),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-bridge`],
    })
  }

  return pathways
}

function buildCopayPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-copay`

  return [
    {
      id: `${baseId}-generic`,
      blockerCode: 'COPAY_PROHIBITIVE',
      pillar,
      type: 'generic_switch',
      title: `${pillarLabel}: Switch to Generic ($4/month)`,
      description: `Switch to therapeutically equivalent generic with guideline-equivalent evidence.`,
      urgency: 'immediate',
      estimatedTime: '20 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-g-s1`, 1, 'Identify generic alternative', 'Select lowest-cost equivalent', true, false, 5),
        makeStep(`${baseId}-g-s2`, 2, 'Clinician approval', 'One-click switch approval', false, true, 10),
        makeStep(`${baseId}-g-s3`, 3, 'Update care plan', 'Reflect generic in pre-visit note', true, false, 5),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-pap`, `${baseId}-copaycard`],
    },
    {
      id: `${baseId}-pap`,
      blockerCode: 'COPAY_PROHIBITIVE',
      pillar,
      type: 'patient_assistance_program',
      title: `${pillarLabel}: Patient Assistance Program`,
      description: `Check eligibility for manufacturer PAP or foundation assistance.`,
      urgency: 'within_week',
      estimatedTime: '5 minutes',
      automationLevel: 'manual',
      steps: [
        makeStep(`${baseId}-p-s1`, 1, 'Identify eligible programs', 'Search PAP database', true, false, 5),
        makeStep(`${baseId}-p-s2`, 2, 'Review eligibility', 'Confirm patient meets criteria', false, true, 120),
        makeStep(`${baseId}-p-s3`, 3, 'Submit application', 'Complete and submit PAP application', false, true, 180),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-generic`],
    },
    {
      id: `${baseId}-copaycard`,
      blockerCode: 'COPAY_PROHIBITIVE',
      pillar,
      type: 'copay_card',
      title: `${pillarLabel}: Copay Savings Card`,
      description: `Apply manufacturer copay card to reduce out-of-pocket cost.`,
      urgency: 'within_visit',
      estimatedTime: '2 minutes',
      automationLevel: 'manual',
      steps: [
        makeStep(`${baseId}-c-s1`, 1, 'Check copay card availability', 'Search manufacturer programs', true, false, 5),
        makeStep(`${baseId}-c-s2`, 2, 'Enroll patient', 'Complete enrollment form', false, true, 90),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-generic`],
    },
  ]
}

function buildFormularyPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-formulary`

  return [
    {
      id: `${baseId}-exception`,
      blockerCode: 'FORMULARY_EXCLUDED',
      pillar,
      type: 'formulary_exception',
      title: `${pillarLabel}: Formulary Exception Request`,
      description: `Request formulary exception with guideline-based medical necessity.`,
      urgency: 'within_visit',
      estimatedTime: '60 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-e-s1`, 1, 'Auto-generate exception', 'Pre-fill with guideline citations', true, false, 5),
        makeStep(`${baseId}-e-s2`, 2, 'Clinician review', 'Review and approve', false, true, 45),
        makeStep(`${baseId}-e-s3`, 3, 'Submit exception', 'Submit to pharmacy benefit', true, false, 10),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-alternative`],
    },
    {
      id: `${baseId}-alternative`,
      blockerCode: 'FORMULARY_EXCLUDED',
      pillar,
      type: 'therapeutic_alternative',
      title: `${pillarLabel}: In-Formulary Alternative`,
      description: `Switch to an in-formulary therapeutic alternative.`,
      urgency: 'immediate',
      estimatedTime: '30 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-a-s1`, 1, 'Identify in-formulary option', 'Search formulary database', true, false, 5),
        makeStep(`${baseId}-a-s2`, 2, 'Clinician review', 'Review and approve switch', false, true, 20),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-exception`],
    },
  ]
}

function buildPAPendingPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-pa_pending`

  return [
    {
      id: `${baseId}-track`,
      blockerCode: 'PA_PENDING',
      pillar,
      type: 'pa_resubmit',
      title: `${pillarLabel}: Track PA Progress`,
      description: `Monitor PA status. Auto-generate appeal if pending >14 days.`,
      urgency: 'within_week',
      estimatedTime: 'Automated tracking',
      automationLevel: 'full',
      steps: [
        makeStep(`${baseId}-t-s1`, 1, 'Check PA status', 'Query payer for current status', true, false, 5),
        makeStep(`${baseId}-t-s2`, 2, 'Set reminder', 'Auto-appeal at 14 days if still pending', true, false, 5),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-bridge`],
    },
    {
      id: `${baseId}-bridge`,
      blockerCode: 'PA_PENDING',
      pillar,
      type: 'step_therapy_start',
      title: `${pillarLabel}: ACEi Bridge While Pending`,
      description: `Start bridge therapy to maintain RAAS inhibition while PA processes.`,
      urgency: 'immediate',
      estimatedTime: '30 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-b-s1`, 1, 'Generate bridge prescription', 'Generic ACEi', true, false, 5),
        makeStep(`${baseId}-b-s2`, 2, 'Clinician approval', 'Approve bridge', false, true, 15),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-track`],
    },
  ]
}

function buildDischargeLostPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-discharge`

  return [
    {
      id: `${baseId}-reconcile`,
      blockerCode: 'DISCHARGE_MED_LOST',
      pillar,
      type: 'discharge_reconciliation',
      title: `${pillarLabel}: Re-prescribe Lost Discharge Medication`,
      description: `Medication from discharge was not filled. Generate immediate re-prescription.`,
      urgency: 'immediate',
      estimatedTime: '20 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-r-s1`, 1, 'Generate prescription', 'Re-prescribe at discharge dose', true, false, 5),
        makeStep(`${baseId}-r-s2`, 2, 'Clinician signature', 'One-click sign', false, true, 10),
      ],
      requiredData: [],
      alternativePathwayIds: [],
    },
  ]
}

function buildHandoffGapPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-handoff`

  return [
    {
      id: `${baseId}-followup`,
      blockerCode: 'HANDOFF_GAP',
      pillar,
      type: 'handoff_followup',
      title: `${pillarLabel}: Handoff Communication`,
      description: `Generate handoff communication to close care transition gap.`,
      urgency: 'within_visit',
      estimatedTime: '45 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-f-s1`, 1, 'Generate handoff note', 'Summarize medication plan and gaps', true, false, 5),
        makeStep(`${baseId}-f-s2`, 2, 'Clinician review', 'Review and send', false, true, 30),
      ],
      requiredData: [],
      alternativePathwayIds: [],
    },
  ]
}

function buildPeriopPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-periop`

  return [
    {
      id: `${baseId}-restart`,
      blockerCode: 'PERIOP_HOLD',
      pillar,
      type: 'periop_restart',
      title: `${pillarLabel}: Post-Operative Restart Schedule`,
      description: `Generate restart schedule for medication held perioperatively.`,
      urgency: 'within_visit',
      estimatedTime: '30 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-r-s1`, 1, 'Generate restart schedule', 'Based on surgery date and medication class', true, false, 5),
        makeStep(`${baseId}-r-s2`, 2, 'Clinician confirmation', 'Confirm oral intake adequate', false, true, 15),
      ],
      requiredData: [],
      alternativePathwayIds: [],
    },
  ]
}

function buildCostBarrierPathways(
  pillar: Pillar,
): ReadonlyArray<ResolutionPathway> {
  const pillarLabel = PILLAR_LABELS[pillar]
  const baseId = `${pillar}-cost`

  return [
    {
      id: `${baseId}-generic`,
      blockerCode: 'COST_BARRIER',
      pillar,
      type: 'generic_switch',
      title: `${pillarLabel}: Generic Alternative`,
      description: `Switch to lower-cost generic with equivalent evidence.`,
      urgency: 'immediate',
      estimatedTime: '20 seconds',
      automationLevel: 'partial',
      steps: [
        makeStep(`${baseId}-g-s1`, 1, 'Find lowest-cost generic', 'Search alternatives database', true, false, 5),
        makeStep(`${baseId}-g-s2`, 2, 'Clinician approval', 'One-click switch', false, true, 10),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-pap`],
    },
    {
      id: `${baseId}-pap`,
      blockerCode: 'COST_BARRIER',
      pillar,
      type: 'patient_assistance_program',
      title: `${pillarLabel}: Assistance Programs`,
      description: `Search for PAPs, copay cards, and pharmacy discount programs.`,
      urgency: 'within_week',
      estimatedTime: '5 minutes',
      automationLevel: 'manual',
      steps: [
        makeStep(`${baseId}-p-s1`, 1, 'Search programs', 'Identify eligible assistance', true, false, 5),
        makeStep(`${baseId}-p-s2`, 2, 'Enroll patient', 'Complete enrollment', false, true, 180),
      ],
      requiredData: [],
      alternativePathwayIds: [`${baseId}-generic`],
    },
  ]
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const PATHWAY_BUILDERS: Readonly<
  Partial<Record<BlockerCode, (pillar: Pillar, snapshot: PatientSnapshot) => ReadonlyArray<ResolutionPathway>>>
> = {
  PA_DENIED: (pillar) => buildPADeniedPathways(pillar),
  STEP_THERAPY_REQUIRED: (pillar, snapshot) => buildStepTherapyPathways(pillar, snapshot),
  COPAY_PROHIBITIVE: (pillar) => buildCopayPathways(pillar),
  FORMULARY_EXCLUDED: (pillar) => buildFormularyPathways(pillar),
  PA_PENDING: (pillar) => buildPAPendingPathways(pillar),
  DISCHARGE_MED_LOST: (pillar) => buildDischargeLostPathways(pillar),
  HANDOFF_GAP: (pillar) => buildHandoffGapPathways(pillar),
  PERIOP_HOLD: (pillar) => buildPeriopPathways(pillar),
  COST_BARRIER: (pillar) => buildCostBarrierPathways(pillar),
}

export function selectResolutionPathways(
  blockerCode: BlockerCode,
  pillar: Pillar,
  snapshot: PatientSnapshot,
  _auditResult: AuditResult,
): ReadonlyArray<ResolutionPathway> {
  if (!isResolvableBlocker(blockerCode)) {
    return []
  }

  const builder = PATHWAY_BUILDERS[blockerCode]
  if (!builder) {
    return []
  }

  return builder(pillar, snapshot)
}

export function hasResolvableBlockers(
  blockers: ReadonlyArray<BlockerCode>,
): boolean {
  return blockers.some(isResolvableBlocker)
}
