import type {
  FHIRBundle,
  FHIRObservation,
  FHIRMedicationRequest,
} from './types.ts'
import { LOINC_CODES } from './types.ts'
import { PILLARS } from '../types/pillar.ts'
import type { Pillar } from '../types/pillar.ts'
import type { PatientSnapshot, Medication } from '../types/patient.ts'
import { lookupMedication } from './rxnorm-lookup.ts'

// ---------------------------------------------------------------------------
// Internal helpers (pure functions)
// ---------------------------------------------------------------------------

interface ResolvedObservation {
  readonly value: number
  readonly date: string
}

/**
 * Extract all Observation resources from a FHIR bundle.
 */
function extractObservations(
  bundle: FHIRBundle,
): ReadonlyArray<FHIRObservation> {
  const entries = bundle.entry ?? []
  return entries
    .map((entry) => entry.resource)
    .filter(
      (resource): resource is FHIRObservation =>
        resource?.resourceType === 'Observation',
    )
}

/**
 * Extract all active MedicationRequest resources from a FHIR bundle.
 */
function extractActiveMedicationRequests(
  bundle: FHIRBundle,
): ReadonlyArray<FHIRMedicationRequest> {
  const entries = bundle.entry ?? []
  return entries
    .map((entry) => entry.resource)
    .filter(
      (resource): resource is FHIRMedicationRequest =>
        resource?.resourceType === 'MedicationRequest'
        && (resource as FHIRMedicationRequest).status === 'active',
    )
}

/**
 * Find the most recent Observation matching a LOINC code.
 * When multiple observations share the same LOINC code, returns the one
 * with the latest effectiveDateTime.
 */
function findMostRecentObservation(
  observations: ReadonlyArray<FHIRObservation>,
  loincCode: string,
): ResolvedObservation | undefined {
  const matching = observations.filter((obs) => {
    const codings = obs.code?.coding ?? []
    return codings.some((coding) => coding.code === loincCode)
  })

  if (matching.length === 0) {
    return undefined
  }

  const sorted = [...matching].sort((a, b) => {
    const dateA = a.effectiveDateTime ?? ''
    const dateB = b.effectiveDateTime ?? ''
    return dateB.localeCompare(dateA)
  })

  const best = sorted[0]
  const value = best.valueQuantity?.value

  if (value === undefined) {
    return undefined
  }

  return {
    value,
    date: best.effectiveDateTime ?? '',
  }
}

/**
 * Extract the RxNorm code from a MedicationRequest's medicationCodeableConcept.
 */
function extractRxNormCode(
  medRequest: FHIRMedicationRequest,
): string | undefined {
  const codings = medRequest.medicationCodeableConcept?.coding ?? []
  const rxnormCoding = codings.find(
    (coding) =>
      coding.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
      && coding.code !== undefined,
  )
  return rxnormCoding?.code
}

/**
 * Extract the dose in mg from a MedicationRequest's dosageInstruction.
 */
function extractDoseMg(
  medRequest: FHIRMedicationRequest,
): number | undefined {
  const instructions = medRequest.dosageInstruction ?? []
  if (instructions.length === 0) {
    return undefined
  }

  const doseAndRate = instructions[0].doseAndRate ?? []
  if (doseAndRate.length === 0) {
    return undefined
  }

  return doseAndRate[0].doseQuantity?.value
}

/**
 * Compute the latest date from a set of optional date strings.
 */
function latestDate(
  dates: ReadonlyArray<string | undefined>,
): string | undefined {
  const valid = dates.filter(
    (d): d is string => d !== undefined && d.length > 0,
  )

  if (valid.length === 0) {
    return undefined
  }

  return [...valid].sort((a, b) => b.localeCompare(a))[0]
}

/**
 * Build a NOT_PRESCRIBED Medication entry for a given pillar.
 */
function makeNotPrescribed(pillar: Pillar): Medication {
  return {
    pillar,
    name: 'Not prescribed',
    doseTier: 'NOT_PRESCRIBED',
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a FHIR R4 Bundle into a PatientSnapshot for the rule engine.
 *
 * Pure function: no side effects, no external dependencies beyond the
 * RxNorm lookup table.
 *
 * Requires: LVEF, SBP, Heart Rate observations (throws if missing).
 * Optional: eGFR, K+, BNP observations.
 * Defaults: nyhaClass = 2.
 */
export function fhirToSnapshot(bundle: FHIRBundle): PatientSnapshot {
  const observations = extractObservations(bundle)

  // --- Required vitals ---
  const lvef = findMostRecentObservation(observations, LOINC_CODES.LVEF)
  if (lvef === undefined) {
    throw new Error('Required observation missing: LVEF (LOINC 10230-1)')
  }

  const sbp = findMostRecentObservation(observations, LOINC_CODES.SBP)
  if (sbp === undefined) {
    throw new Error('Required observation missing: SBP (LOINC 8480-6)')
  }

  const hr = findMostRecentObservation(observations, LOINC_CODES.HEART_RATE)
  if (hr === undefined) {
    throw new Error(
      'Required observation missing: Heart Rate (LOINC 8867-4)',
    )
  }

  // --- Optional labs ---
  const egfr = findMostRecentObservation(observations, LOINC_CODES.EGFR)
  const potassium = findMostRecentObservation(
    observations,
    LOINC_CODES.POTASSIUM,
  )
  const bnp = findMostRecentObservation(observations, LOINC_CODES.BNP)
  const ntProBnp = findMostRecentObservation(observations, LOINC_CODES.NT_PRO_BNP)

  // --- Dates ---
  const vitalsDate =
    latestDate([sbp.date, hr.date]) ?? sbp.date

  const labsDate = latestDate([egfr?.date, potassium?.date, bnp?.date, ntProBnp?.date])

  // --- Medications ---
  const medRequests = extractActiveMedicationRequests(bundle)

  const resolvedMeds: Medication[] = []
  const coveredPillars = new Set<Pillar>()

  for (const medRequest of medRequests) {
    const rxnormCode = extractRxNormCode(medRequest)
    if (rxnormCode === undefined) {
      continue
    }

    const doseMg = extractDoseMg(medRequest) ?? 0
    const mapping = lookupMedication(rxnormCode, doseMg)

    if (mapping === undefined) {
      continue
    }

    // Skip if we already have a medication for this pillar
    // (first match wins; could be extended to pick highest dose)
    if (coveredPillars.has(mapping.pillar)) {
      continue
    }

    coveredPillars.add(mapping.pillar)
    resolvedMeds.push({
      pillar: mapping.pillar,
      name: mapping.name,
      doseTier: mapping.doseTier,
    })
  }

  // Fill NOT_PRESCRIBED for missing pillars
  const allPillars: ReadonlyArray<Pillar> = [
    PILLARS.ARNI_ACEi_ARB,
    PILLARS.BETA_BLOCKER,
    PILLARS.MRA,
    PILLARS.SGLT2i,
  ]

  const medications: ReadonlyArray<Medication> = [
    ...resolvedMeds,
    ...allPillars
      .filter((pillar) => !coveredPillars.has(pillar))
      .map(makeNotPrescribed),
  ]

  // --- Assemble snapshot ---
  const snapshot: PatientSnapshot = {
    ef: lvef.value,
    nyhaClass: 2,
    sbp: sbp.value,
    hr: hr.value,
    vitalsDate,
    ...(egfr !== undefined ? { egfr: egfr.value } : {}),
    ...(potassium !== undefined ? { potassium: potassium.value } : {}),
    ...(labsDate !== undefined ? { labsDate } : {}),
    ...(bnp !== undefined ? { bnp: bnp.value } : {}),
    ...(ntProBnp !== undefined ? { ntProBnp: ntProBnp.value } : {}),
    medications,
  }

  return snapshot
}
