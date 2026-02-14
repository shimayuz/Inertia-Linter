import type { PatientSnapshot, Pillar, BlockerCode } from '../types/index.ts'
import { getThresholdsForPillar } from '../data/load-ruleset.ts'
import { detectStaleData } from './detect-stale.ts'

function checkBPLow(sbp: number, threshold: number | undefined): boolean {
  return threshold !== undefined && sbp < threshold
}

function checkHRLow(hr: number, threshold: number | undefined): boolean {
  return threshold !== undefined && hr < threshold
}

function checkKHigh(potassium: number | undefined, threshold: number | undefined): boolean {
  if (threshold === undefined || potassium === undefined) {
    return false
  }
  return potassium > threshold
}

function checkEGFRLow(
  egfr: number | undefined,
  threshold: number | undefined,
): boolean {
  if (threshold === undefined || egfr === undefined) {
    return false
  }
  return egfr < threshold
}

function checkUnknownLabs(
  patient: PatientSnapshot,
  thresholds: { readonly egfr_init?: number; readonly egfr_cont?: number; readonly k_high?: number },
): boolean {
  if (thresholds.egfr_init !== undefined || thresholds.egfr_cont !== undefined) {
    if (patient.egfr === undefined) {
      return true
    }
  }
  if (thresholds.k_high !== undefined && patient.potassium === undefined) {
    return true
  }
  return false
}

function checkADRHistory(patient: PatientSnapshot, pillar: Pillar): boolean {
  const medWithADR = patient.medications.find(
    (med) => med.pillar === pillar && med.hasADR === true,
  )
  if (medWithADR) {
    return true
  }
  if (patient.history?.adrHistory?.[pillar] !== undefined) {
    return true
  }
  return false
}

function checkAllergy(patient: PatientSnapshot, pillar: Pillar): boolean {
  const medWithAllergy = patient.medications.find(
    (med) => med.pillar === pillar && med.hasAllergy === true,
  )
  if (medWithAllergy) {
    return true
  }
  if (patient.history?.allergies?.includes(pillar)) {
    return true
  }
  return false
}

function checkPatientRefusal(patient: PatientSnapshot, pillar: Pillar): boolean {
  return patient.medications.some(
    (med) => med.pillar === pillar && med.patientRefusal === true,
  )
}

function checkCostBarrier(patient: PatientSnapshot, pillar: Pillar): boolean {
  return patient.medications.some(
    (med) => med.pillar === pillar && med.costBarrier === true,
  )
}

export function detectBlockers(
  patient: PatientSnapshot,
  pillar: Pillar,
  isInitiation: boolean,
  referenceDate?: Date,
): ReadonlyArray<BlockerCode> {
  const thresholds = getThresholdsForPillar(pillar)
  const blockers: BlockerCode[] = []

  if (checkBPLow(patient.sbp, thresholds.bp_low_sbp)) {
    blockers.push('BP_LOW')
  }

  if (checkHRLow(patient.hr, thresholds.hr_low)) {
    blockers.push('HR_LOW')
  }

  if (checkKHigh(patient.potassium, thresholds.k_high)) {
    blockers.push('K_HIGH')
  }

  if (isInitiation) {
    if (checkEGFRLow(patient.egfr, thresholds.egfr_init)) {
      blockers.push('EGFR_LOW_INIT')
    }
  } else {
    if (checkEGFRLow(patient.egfr, thresholds.egfr_cont)) {
      blockers.push('EGFR_LOW_CONT')
    }
  }

  if (patient.history?.recentAKI === true) {
    blockers.push('RECENT_AKI')
  }

  const staleBlockers = detectStaleData(patient, referenceDate)
  for (const staleBlocker of staleBlockers) {
    blockers.push(staleBlocker)
  }

  if (checkUnknownLabs(patient, thresholds)) {
    blockers.push('UNKNOWN_LABS')
  }

  if (checkADRHistory(patient, pillar)) {
    blockers.push('ADR_HISTORY')
  }

  if (checkAllergy(patient, pillar)) {
    blockers.push('ALLERGY')
  }

  if (checkPatientRefusal(patient, pillar)) {
    blockers.push('PATIENT_REFUSAL')
  }

  if (checkCostBarrier(patient, pillar)) {
    blockers.push('COST_BARRIER')
  }

  if (blockers.length === 0) {
    return ['CLINICAL_INERTIA']
  }

  return blockers
}
