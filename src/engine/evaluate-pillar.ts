import type {
  PatientSnapshot,
  Pillar,
  PillarResult,
  PillarStatus,
  DoseTier,
  BlockerCode,
  Medication,
} from '../types/index.ts'
import { detectBlockers } from './detect-blockers.ts'
import { detectStaleData } from './detect-stale.ts'

function findMedication(
  medications: ReadonlyArray<Medication>,
  pillar: Pillar,
): Medication | undefined {
  return medications.find(
    (med) => med.pillar === pillar && med.doseTier !== 'NOT_PRESCRIBED',
  )
}

function determineStatus(
  medication: Medication | undefined,
  blockers: ReadonlyArray<BlockerCode>,
): PillarStatus {
  if (medication !== undefined) {
    if (medication.doseTier === 'HIGH') {
      return 'ON_TARGET'
    }
    return 'UNDERDOSED'
  }

  if (blockers.includes('ALLERGY')) {
    return 'CONTRAINDICATED'
  }

  if (blockers.includes('UNKNOWN_LABS')) {
    const hasOnlySafetyOrDataBlockers = blockers.every(
      (b) =>
        b === 'UNKNOWN_LABS' ||
        b === 'STALE_LABS' ||
        b === 'STALE_VITALS',
    )
    if (hasOnlySafetyOrDataBlockers) {
      return 'UNKNOWN'
    }
  }

  return 'MISSING'
}

function buildMissingInfo(
  patient: PatientSnapshot,
  blockers: ReadonlyArray<BlockerCode>,
): ReadonlyArray<string> {
  const info: string[] = []

  if (blockers.includes('UNKNOWN_LABS')) {
    if (patient.egfr === undefined) {
      info.push('Obtain eGFR')
    }
    if (patient.potassium === undefined) {
      info.push('Obtain K+')
    }
  }

  if (blockers.includes('STALE_LABS')) {
    info.push('Update lab values (last obtained >14 days ago)')
  }

  if (blockers.includes('STALE_VITALS')) {
    info.push('Update vital signs (last obtained >30 days ago)')
  }

  return info
}

export function evaluatePillar(
  patient: PatientSnapshot,
  pillar: Pillar,
  referenceDate?: Date,
): PillarResult {
  const medication = findMedication(patient.medications, pillar)
  const isInitiation = medication === undefined
  const doseTier: DoseTier = medication?.doseTier ?? 'NOT_PRESCRIBED'

  const ref = referenceDate ?? new Date()

  const pillarBlockers = detectBlockers(patient, pillar, isInitiation, ref)
  const staleBlockers = detectStaleData(patient, ref)

  const allBlockersSet = new Set<BlockerCode>([...pillarBlockers, ...staleBlockers])

  // ON_TARGET medications have no blockers
  if (medication !== undefined && medication.doseTier === 'HIGH') {
    allBlockersSet.clear()
  }

  const allBlockers: ReadonlyArray<BlockerCode> = [...allBlockersSet]

  const status = determineStatus(medication, allBlockers)
  const missingInfo = buildMissingInfo(patient, allBlockers)

  return {
    pillar,
    status,
    doseTier,
    blockers: allBlockers,
    missingInfo,
  }
}
