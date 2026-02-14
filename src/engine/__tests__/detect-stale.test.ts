import { describe, it, expect } from 'vitest'
import { detectStaleData } from '../detect-stale'
import type { PatientSnapshot } from '../../types'

function makePatient(overrides: Partial<PatientSnapshot> = {}): PatientSnapshot {
  return {
    ef: 30,
    nyhaClass: 2,
    sbp: 120,
    hr: 70,
    vitalsDate: new Date().toISOString().split('T')[0],
    egfr: 60,
    potassium: 4.0,
    labsDate: new Date().toISOString().split('T')[0],
    medications: [],
    ...overrides,
  }
}

function daysAgo(days: number, referenceDate: Date = new Date()): string {
  const d = new Date(referenceDate)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

describe('detectStaleData', () => {
  const refDate = new Date('2026-02-15')

  it('returns no staleness for labs dated today', () => {
    const patient = makePatient({
      labsDate: '2026-02-15',
      vitalsDate: '2026-02-15',
    })
    expect(detectStaleData(patient, refDate)).toEqual([])
  })

  it('returns STALE_LABS for labs dated 15 days ago', () => {
    const patient = makePatient({
      labsDate: daysAgo(15, refDate),
      vitalsDate: '2026-02-15',
    })
    const result = detectStaleData(patient, refDate)
    expect(result).toContain('STALE_LABS')
    expect(result).not.toContain('STALE_VITALS')
  })

  it('does NOT return STALE_LABS for labs dated 14 days ago (boundary: >14 days means 15+)', () => {
    const patient = makePatient({
      labsDate: daysAgo(14, refDate),
      vitalsDate: '2026-02-15',
    })
    expect(detectStaleData(patient, refDate)).toEqual([])
  })

  it('returns no staleness for vitals dated today', () => {
    const patient = makePatient({
      labsDate: '2026-02-15',
      vitalsDate: '2026-02-15',
    })
    expect(detectStaleData(patient, refDate)).toEqual([])
  })

  it('returns STALE_VITALS for vitals dated 31 days ago', () => {
    const patient = makePatient({
      labsDate: '2026-02-15',
      vitalsDate: daysAgo(31, refDate),
    })
    const result = detectStaleData(patient, refDate)
    expect(result).toContain('STALE_VITALS')
    expect(result).not.toContain('STALE_LABS')
  })

  it('does NOT return STALE_VITALS for vitals dated 30 days ago (boundary: >30 means 31+)', () => {
    const patient = makePatient({
      labsDate: '2026-02-15',
      vitalsDate: daysAgo(30, refDate),
    })
    expect(detectStaleData(patient, refDate)).toEqual([])
  })

  it('returns UNKNOWN_LABS when labsDate is missing', () => {
    const patient = makePatient({
      labsDate: undefined,
      vitalsDate: '2026-02-15',
    })
    const result = detectStaleData(patient, refDate)
    expect(result).toContain('UNKNOWN_LABS')
  })

  it('returns both STALE_LABS and STALE_VITALS when both are stale', () => {
    const patient = makePatient({
      labsDate: daysAgo(15, refDate),
      vitalsDate: daysAgo(31, refDate),
    })
    const result = detectStaleData(patient, refDate)
    expect(result).toContain('STALE_LABS')
    expect(result).toContain('STALE_VITALS')
    expect(result).toHaveLength(2)
  })
})
