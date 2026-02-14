import type { PatientSnapshot, BlockerCode } from '../types'

const LABS_STALE_DAYS = 14
const VITALS_STALE_DAYS = 30

function daysBetween(dateStr: string, referenceDate: Date): number {
  const date = new Date(dateStr)
  const diffMs = referenceDate.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function detectStaleData(
  patient: PatientSnapshot,
  referenceDate: Date = new Date()
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  if (patient.labsDate === undefined) {
    blockers.push('UNKNOWN_LABS')
  } else if (daysBetween(patient.labsDate, referenceDate) > LABS_STALE_DAYS) {
    blockers.push('STALE_LABS')
  }

  if (daysBetween(patient.vitalsDate, referenceDate) > VITALS_STALE_DAYS) {
    blockers.push('STALE_VITALS')
  }

  return blockers
}
