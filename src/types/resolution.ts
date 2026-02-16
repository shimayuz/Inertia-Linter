import type { BlockerCode } from './blocker.ts'
import type { Pillar } from './pillar.ts'
import type { DoseTier } from './dose-tier.ts'

// ---------------------------------------------------------------------------
// Resolution Pathway
// ---------------------------------------------------------------------------

export type ResolutionPathwayType =
  | 'pa_appeal'
  | 'pa_resubmit'
  | 'step_therapy_start'
  | 'step_therapy_exception'
  | 'formulary_exception'
  | 'generic_switch'
  | 'therapeutic_alternative'
  | 'patient_assistance_program'
  | 'copay_card'
  | 'pharmacy_discount'
  | 'discharge_reconciliation'
  | 'handoff_followup'
  | 'periop_restart'

export type ResolutionStatus =
  | 'not_started'
  | 'auto_preparing'
  | 'clinician_review'
  | 'submitted'
  | 'in_progress'
  | 'approved'
  | 'denied'
  | 'completed'
  | 'abandoned'

export interface ResolutionStep {
  readonly id: string
  readonly order: number
  readonly title: string
  readonly description: string
  readonly isAutomated: boolean
  readonly requiresClinicianInput: boolean
  readonly estimatedSeconds: number
}

export interface RequiredDataField {
  readonly field: string
  readonly label: string
  readonly source: 'patient_snapshot' | 'audit_result' | 'clinician_input' | 'insurance_data'
  readonly isAvailable: boolean
  readonly currentValue?: string
}

export interface ResolutionPathway {
  readonly id: string
  readonly blockerCode: BlockerCode
  readonly pillar: Pillar
  readonly type: ResolutionPathwayType
  readonly title: string
  readonly description: string
  readonly urgency: 'immediate' | 'within_visit' | 'within_week' | 'next_visit'
  readonly estimatedTime: string
  readonly automationLevel: 'full' | 'partial' | 'manual'
  readonly steps: ReadonlyArray<ResolutionStep>
  readonly requiredData: ReadonlyArray<RequiredDataField>
  readonly alternativePathwayIds: ReadonlyArray<string>
}

// ---------------------------------------------------------------------------
// Resolution Record (progress tracking)
// ---------------------------------------------------------------------------

export interface StepProgress {
  readonly stepId: string
  readonly status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  readonly completedAt?: string
  readonly autoCompleted: boolean
}

export interface GeneratedDocument {
  readonly type: 'pa_form' | 'appeal_letter' | 'pap_application' | 'step_therapy_log' | 'restart_order'
  readonly title: string
  readonly generatedAt: string
  readonly content: string
  readonly requiresReview: boolean
  readonly isApproved: boolean
}

export interface ResolutionRecord {
  readonly id: string
  readonly pathwayId: string
  readonly pathwayType: ResolutionPathwayType
  readonly blockerCode: BlockerCode
  readonly pillar: Pillar
  readonly status: ResolutionStatus
  readonly startedAt: string
  readonly updatedAt: string
  readonly completedAt?: string
  readonly stepProgress: ReadonlyArray<StepProgress>
  readonly generatedDocuments: ReadonlyArray<GeneratedDocument>
}

export type ResolutionEventType =
  | 'start'
  | 'auto_step_complete'
  | 'clinician_approve'
  | 'clinician_reject'
  | 'submit'
  | 'external_approve'
  | 'external_deny'
  | 'complete'
  | 'abandon'

export interface ResolutionEvent {
  readonly type: ResolutionEventType
  readonly stepId?: string
  readonly timestamp: string
  readonly data?: Readonly<Record<string, string>>
}

// ---------------------------------------------------------------------------
// PA Form (US Focus)
// ---------------------------------------------------------------------------

export interface InsuranceInfo {
  readonly payerName?: string
  readonly planType?: 'commercial' | 'medicare' | 'medicaid' | 'other'
  readonly memberId?: string
  readonly groupNumber?: string
  readonly pharmacyBenefitPhone?: string
}

export interface PrescriberInfo {
  readonly npi?: string
  readonly name?: string
  readonly specialty?: string
  readonly phone?: string
  readonly fax?: string
}

export interface PriorDrugTrial {
  readonly drugName: string
  readonly pillar: Pillar
  readonly startDate: string
  readonly endDate?: string
  readonly durationDays: number
  readonly outcome: 'tolerated' | 'intolerable' | 'ineffective' | 'contraindicated'
  readonly reasonStopped?: string
}

export interface PAFormData {
  readonly id: string
  readonly generatedAt: string
  readonly status: 'draft' | 'clinician_review' | 'approved' | 'submitted'
  readonly requestedDrug: string
  readonly requestedDrugPillar: Pillar
  readonly requestedDoseTier: DoseTier
  readonly diagnosisCode: string
  readonly diagnosisDescription: string
  readonly efPercent: number
  readonly nyhaClass: 1 | 2 | 3 | 4
  readonly clinicalJustification: string
  readonly guidelineReference: string
  readonly guidelineClass: string
  readonly priorTrials: ReadonlyArray<PriorDrugTrial>
  readonly relevantLabs: ReadonlyArray<{
    readonly name: string
    readonly value: number
    readonly unit: string
    readonly date: string
  }>
  readonly insurance: InsuranceInfo
  readonly prescriber: PrescriberInfo
}

// ---------------------------------------------------------------------------
// Medication Alternatives
// ---------------------------------------------------------------------------

export interface MedicationAlternative {
  readonly drugName: string
  readonly genericName: string
  readonly pillar: Pillar
  readonly isGeneric: boolean
  readonly estimatedMonthlyCost: string
  readonly formularyLikelihood: 'high' | 'medium' | 'low'
  readonly clinicalEquivalence: 'equivalent' | 'similar' | 'different_mechanism'
  readonly guidelineSupport: string
  readonly switchConsiderations: ReadonlyArray<string>
}

export interface AssistanceProgram {
  readonly id: string
  readonly programName: string
  readonly manufacturer: string
  readonly drugsCovered: ReadonlyArray<string>
  readonly eligibilityCriteria: ReadonlyArray<string>
  readonly estimatedSavings: string
  readonly programType: 'pap' | 'copay_card' | 'foundation' | 'pharmacy_discount'
}

// ---------------------------------------------------------------------------
// Patient Resolution Context
// ---------------------------------------------------------------------------

export interface PatientResolutionContext {
  readonly insurance?: InsuranceInfo
  readonly prescriber?: PrescriberInfo
  readonly priorTrials?: ReadonlyArray<PriorDrugTrial>
  readonly activeResolutions?: ReadonlyArray<ResolutionRecord>
}
