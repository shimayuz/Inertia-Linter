// FHIR R4 type definitions for Inertia Linter
// Subset of FHIR R4 resources relevant to heart failure GDMT auditing

// ---------------------------------------------------------------------------
// Primitives & building blocks
// ---------------------------------------------------------------------------

export interface FHIRCoding {
  readonly system?: string
  readonly code?: string
  readonly display?: string
}

export interface FHIRCodeableConcept {
  readonly coding?: ReadonlyArray<FHIRCoding>
  readonly text?: string
}

export interface FHIRQuantity {
  readonly value?: number
  readonly unit?: string
  readonly system?: string
  readonly code?: string
}

export interface FHIRReference {
  readonly reference?: string
  readonly display?: string
}

export interface FHIRPeriod {
  readonly start?: string
  readonly end?: string
}

// ---------------------------------------------------------------------------
// Base resource
// ---------------------------------------------------------------------------

export interface FHIRResource {
  readonly resourceType: string
  readonly id?: string
}

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------

export interface FHIRPatient extends FHIRResource {
  readonly resourceType: 'Patient'
  readonly name?: ReadonlyArray<{
    readonly family?: string
    readonly given?: ReadonlyArray<string>
  }>
  readonly gender?: 'male' | 'female' | 'other' | 'unknown'
  readonly birthDate?: string
}

// ---------------------------------------------------------------------------
// Observation
// ---------------------------------------------------------------------------

export interface FHIRObservation extends FHIRResource {
  readonly resourceType: 'Observation'
  readonly status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown'
  readonly code: FHIRCodeableConcept
  readonly subject?: FHIRReference
  readonly effectiveDateTime?: string
  readonly valueQuantity?: FHIRQuantity
}

// ---------------------------------------------------------------------------
// Dosage & MedicationRequest
// ---------------------------------------------------------------------------

export interface FHIRDosage {
  readonly text?: string
  readonly timing?: {
    readonly repeat?: {
      readonly frequency?: number
      readonly period?: number
      readonly periodUnit?: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a'
    }
  }
  readonly doseAndRate?: ReadonlyArray<{
    readonly doseQuantity?: FHIRQuantity
  }>
}

export interface FHIRMedicationRequest extends FHIRResource {
  readonly resourceType: 'MedicationRequest'
  readonly status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown'
  readonly intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option'
  readonly medicationCodeableConcept?: FHIRCodeableConcept
  readonly subject?: FHIRReference
  readonly authoredOn?: string
  readonly dosageInstruction?: ReadonlyArray<FHIRDosage>
}

// ---------------------------------------------------------------------------
// Condition
// ---------------------------------------------------------------------------

export interface FHIRCondition extends FHIRResource {
  readonly resourceType: 'Condition'
  readonly clinicalStatus?: FHIRCodeableConcept
  readonly code?: FHIRCodeableConcept
  readonly subject?: FHIRReference
  readonly onsetDateTime?: string
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

export interface FHIRBundleEntry {
  readonly fullUrl?: string
  readonly resource?: FHIRResource
}

export interface FHIRBundle extends FHIRResource {
  readonly resourceType: 'Bundle'
  readonly type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection'
  readonly entry?: ReadonlyArray<FHIRBundleEntry>
}

// ---------------------------------------------------------------------------
// LOINC code constants
// ---------------------------------------------------------------------------

export const LOINC_CODES = {
  HEART_RATE: '8867-4',
  SBP: '8480-6',
  DBP: '8462-4',
  EGFR: '33914-3',
  POTASSIUM: '6298-4',
  LVEF: '10230-1',
  BNP: '42176-8',
  NT_PRO_BNP: '33762-6',
  HBA1C: '4548-4',
  FASTING_GLUCOSE: '1558-6',
  BMI: '39156-5',
} as const

export type LoincCode = typeof LOINC_CODES[keyof typeof LOINC_CODES]

// ---------------------------------------------------------------------------
// Condition code constants (SNOMED CT + ICD-10)
// ---------------------------------------------------------------------------

export const CONDITION_CODES = {
  HEART_FAILURE: {
    SNOMED: '84114007',
    ICD: 'I50',
  },
  ACS: {
    SNOMED: '394659003',
    ICD: 'I21',
  },
  TYPE2_DIABETES: {
    SNOMED: '44054006',
    ICD: 'E11',
  },
  HYPERTENSION: {
    SNOMED: '38341003',
    ICD: 'I10',
  },
} as const
