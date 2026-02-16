export { EF_CATEGORIES, EF_THRESHOLDS } from './ef-category.ts'
export type { EFCategory } from './ef-category.ts'

export { PILLARS, PILLAR_LABELS, PILLAR_STATUSES, PILLAR_STATUS_COLORS, HF_PILLARS, DM_PILLARS, HTN_PILLARS } from './pillar.ts'
export type { Pillar, PillarStatus } from './pillar.ts'

export {
  BLOCKER_CODES,
  BLOCKER_UI_LABELS,
  BLOCKER_CATEGORIES,
  BLOCKER_CODE_CATEGORY,
} from './blocker.ts'
export type { BlockerCode, BlockerCategory, BlockerInfo } from './blocker.ts'

export { DOSE_TIERS, DOSE_TIER_POINTS, DOSE_TIER_LABELS } from './dose-tier.ts'
export type { DoseTier } from './dose-tier.ts'

export type { AccessBarrierType, AccessBarrier, Medication, PatientHistory, PatientSnapshot } from './patient.ts'

export type { PillarResult, GDMTScore, AuditResult } from './audit.ts'

export type { GuidelinePosition, GuidelineComparison } from './guideline.ts'

export type { BarrierInfo } from './inertia-buster.ts'

export type { ImageData, ExtractionConfidence, ExtractionResult } from './vision.ts'

export type { DoseStep, DrugTargetDose } from './target-dose.ts'

export type { Citation, ChatMessage, ConversationStarter } from './chat.ts'

export type { ClinicalEvent, TimelineEntry, PatientTimeline } from './timeline.ts'

export type { ActionDecision, ActionPriority, ActionCategory, ActionItem, ActionDecisionRecord } from './action-plan.ts'

export { MASCOT_EMOTIONS } from './mascot.ts'
export type { MascotEmotion } from './mascot.ts'

export type { MedicationChangeType, MedicationPlan, PatientExplanation, ResolutionTask, PreVisitNote } from './pre-visit-note.ts'

export type { PatientSource, AppointmentPatient } from './appointment.ts'

export type {
  ResolutionPathwayType,
  ResolutionStatus,
  ResolutionStep,
  RequiredDataField,
  ResolutionPathway,
  StepProgress,
  GeneratedDocument,
  ResolutionRecord,
  ResolutionEventType,
  ResolutionEvent,
  InsuranceInfo,
  PrescriberInfo,
  PriorDrugTrial,
  PAFormData,
  MedicationAlternative,
  AssistanceProgram,
  PatientResolutionContext,
} from './resolution.ts'

export { NUDGE_TYPES, NUDGE_PRIORITIES, NUDGE_STATUSES, METRIC_STATUSES } from './patient-view.ts'
export type {
  NudgeType,
  NudgePriority,
  NudgeStatus,
  Nudge,
  PatientInsight,
  DecisionOption,
  SharedDecisionContext,
  MetricStatus,
  MetricTarget,
  ClinicalMetric,
} from './patient-view.ts'
