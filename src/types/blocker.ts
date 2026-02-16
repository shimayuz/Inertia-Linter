export const BLOCKER_CODES = {
  // Vitals
  BP_LOW: 'BP_LOW',
  HR_LOW: 'HR_LOW',
  // Labs
  K_HIGH: 'K_HIGH',
  EGFR_LOW_INIT: 'EGFR_LOW_INIT',
  EGFR_LOW_CONT: 'EGFR_LOW_CONT',
  // Safety
  RECENT_AKI: 'RECENT_AKI',
  ADR_HISTORY: 'ADR_HISTORY',
  ALLERGY: 'ALLERGY',
  // Data quality
  STALE_LABS: 'STALE_LABS',
  STALE_VITALS: 'STALE_VITALS',
  UNKNOWN_LABS: 'UNKNOWN_LABS',
  // System
  CLINICAL_INERTIA: 'CLINICAL_INERTIA',
  OTHER: 'OTHER',
  PERIOP_HOLD: 'PERIOP_HOLD',
  // Patient
  PATIENT_REFUSAL: 'PATIENT_REFUSAL',
  COST_BARRIER: 'COST_BARRIER',
  COPAY_PROHIBITIVE: 'COPAY_PROHIBITIVE',
  // Access
  PA_PENDING: 'PA_PENDING',
  PA_DENIED: 'PA_DENIED',
  STEP_THERAPY_REQUIRED: 'STEP_THERAPY_REQUIRED',
  FORMULARY_EXCLUDED: 'FORMULARY_EXCLUDED',
  // Transition
  DISCHARGE_MED_LOST: 'DISCHARGE_MED_LOST',
  HANDOFF_GAP: 'HANDOFF_GAP',
  // DM-specific
  HYPOGLYCEMIA_RISK: 'HYPOGLYCEMIA_RISK',
  LACTIC_ACIDOSIS_RISK: 'LACTIC_ACIDOSIS_RISK',
  HBA1C_AT_GOAL: 'HBA1C_AT_GOAL',
  GI_INTOLERANCE: 'GI_INTOLERANCE',
  PANCREATITIS_HISTORY: 'PANCREATITIS_HISTORY',
  // HTN-specific
  ANGIOEDEMA_HISTORY: 'ANGIOEDEMA_HISTORY',
  PREGNANCY_RISK: 'PREGNANCY_RISK',
  GOUT_RISK: 'GOUT_RISK',
  ANKLE_EDEMA: 'ANKLE_EDEMA',
  BP_AT_GOAL: 'BP_AT_GOAL',
} as const

export type BlockerCode = typeof BLOCKER_CODES[keyof typeof BLOCKER_CODES]

export const BLOCKER_UI_LABELS: Readonly<Record<BlockerCode, string>> = {
  BP_LOW: 'Low blood pressure (SBP)',
  HR_LOW: 'Low heart rate',
  K_HIGH: 'Elevated potassium',
  EGFR_LOW_INIT: 'Low eGFR (initiation threshold)',
  EGFR_LOW_CONT: 'Low eGFR (continuation threshold)',
  RECENT_AKI: 'Recent acute kidney injury',
  ADR_HISTORY: 'Prior adverse drug reaction',
  ALLERGY: 'Drug allergy',
  STALE_LABS: 'Lab results older than 14 days',
  STALE_VITALS: 'Vitals older than 30 days',
  UNKNOWN_LABS: 'Lab values not available',
  CLINICAL_INERTIA: 'No identified blocker \u2014 Eligible to consider intensification',
  PATIENT_REFUSAL: 'Patient preference/refusal',
  COST_BARRIER: 'Cost or access barrier',
  OTHER: 'Other clinical reason',
  PA_PENDING: 'Prior authorization pending',
  PA_DENIED: 'Prior authorization denied',
  STEP_THERAPY_REQUIRED: 'Step therapy required by payer',
  COPAY_PROHIBITIVE: 'Prohibitive copay/out-of-pocket cost',
  FORMULARY_EXCLUDED: 'Not on formulary',
  DISCHARGE_MED_LOST: 'Medication not continued after discharge',
  HANDOFF_GAP: 'Care transition gap identified',
  PERIOP_HOLD: 'Perioperative medication hold',
  HYPOGLYCEMIA_RISK: 'Hypoglycemia risk with current regimen',
  LACTIC_ACIDOSIS_RISK: 'Lactic acidosis risk (eGFR too low for metformin)',
  HBA1C_AT_GOAL: 'HbA1c at goal \u2014 no intensification needed',
  GI_INTOLERANCE: 'GI intolerance history',
  PANCREATITIS_HISTORY: 'History of pancreatitis',
  ANGIOEDEMA_HISTORY: 'History of angioedema',
  PREGNANCY_RISK: 'Pregnancy or pregnancy risk',
  GOUT_RISK: 'Gout or hyperuricemia risk',
  ANKLE_EDEMA: 'Ankle edema limiting CCB use',
  BP_AT_GOAL: 'Blood pressure at goal \u2014 no intensification needed',
} as const

export const BLOCKER_CATEGORIES = {
  VITALS: 'VITALS',
  LABS: 'LABS',
  SAFETY: 'SAFETY',
  DATA_QUALITY: 'DATA_QUALITY',
  PATIENT: 'PATIENT',
  SYSTEM: 'SYSTEM',
  ACCESS: 'ACCESS',
  TRANSITION: 'TRANSITION',
} as const

export type BlockerCategory = typeof BLOCKER_CATEGORIES[keyof typeof BLOCKER_CATEGORIES]

export const BLOCKER_CODE_CATEGORY: Readonly<Record<BlockerCode, BlockerCategory>> = {
  BP_LOW: 'VITALS',
  HR_LOW: 'VITALS',
  K_HIGH: 'LABS',
  EGFR_LOW_INIT: 'LABS',
  EGFR_LOW_CONT: 'LABS',
  RECENT_AKI: 'SAFETY',
  ADR_HISTORY: 'SAFETY',
  ALLERGY: 'SAFETY',
  STALE_LABS: 'DATA_QUALITY',
  STALE_VITALS: 'DATA_QUALITY',
  UNKNOWN_LABS: 'DATA_QUALITY',
  CLINICAL_INERTIA: 'SYSTEM',
  PATIENT_REFUSAL: 'PATIENT',
  COST_BARRIER: 'PATIENT',
  OTHER: 'SYSTEM',
  PA_PENDING: 'ACCESS',
  PA_DENIED: 'ACCESS',
  STEP_THERAPY_REQUIRED: 'ACCESS',
  COPAY_PROHIBITIVE: 'PATIENT',
  FORMULARY_EXCLUDED: 'ACCESS',
  DISCHARGE_MED_LOST: 'TRANSITION',
  HANDOFF_GAP: 'TRANSITION',
  PERIOP_HOLD: 'SYSTEM',
  HYPOGLYCEMIA_RISK: 'SAFETY',
  LACTIC_ACIDOSIS_RISK: 'SAFETY',
  HBA1C_AT_GOAL: 'SYSTEM',
  GI_INTOLERANCE: 'SAFETY',
  PANCREATITIS_HISTORY: 'SAFETY',
  ANGIOEDEMA_HISTORY: 'SAFETY',
  PREGNANCY_RISK: 'SAFETY',
  GOUT_RISK: 'SAFETY',
  ANKLE_EDEMA: 'SAFETY',
  BP_AT_GOAL: 'SYSTEM',
} as const

import type { Pillar } from './pillar.ts'

export interface BlockerInfo {
  readonly code: BlockerCode
  readonly pillar: Pillar
  readonly uiLabel: string
  readonly category: BlockerCategory
}
