import { describe, it, expect } from 'vitest'
import { generateNudges } from '../generate-nudges'
import type { AuditResult, PillarResult } from '../../types/audit'
import type { PatientSnapshot } from '../../types/patient'
import { PILLARS, PILLAR_STATUSES, DOSE_TIERS } from '../../types'

function makePillarResult(
  pillar: PillarResult['pillar'],
  status: PillarResult['status'],
  doseTier: PillarResult['doseTier'],
  blockers: ReadonlyArray<string> = [],
): PillarResult {
  return {
    pillar,
    status,
    doseTier,
    blockers: blockers as ReadonlyArray<PillarResult['blockers'][number]>,
    missingInfo: [],
  }
}

function makeAuditResult(
  pillarResults: ReadonlyArray<PillarResult>,
  options: { domainId?: string; efCategory?: AuditResult['efCategory']; score?: number; maxPossible?: number } = {},
): AuditResult {
  const { efCategory = 'HFrEF', score = 50, maxPossible = 100, domainId } = options
  return {
    domainId,
    efCategory,
    pillarResults,
    gdmtScore: {
      score,
      maxPossible,
      normalized: maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0,
      excludedPillars: [],
      isIncomplete: false,
    },
    missingInfo: [],
    nextBestQuestions: [],
    timestamp: '2026-02-16T00:00:00Z',
  }
}

function makePatient(overrides: Partial<PatientSnapshot> = {}): PatientSnapshot {
  return {
    ef: 30,
    nyhaClass: 2,
    sbp: 118,
    hr: 68,
    vitalsDate: '2026-02-14',
    egfr: 55,
    potassium: 4.2,
    labsDate: '2026-02-14',
    medications: [],
    ...overrides,
  }
}

describe('generateNudges', () => {
  it('generates medication reminder nudge for MISSING pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const medNudges = nudges.filter((n) => n.type === 'medication_reminder')
    expect(medNudges.length).toBe(1)
    expect(medNudges[0].priority).toBe('high')
    expect(medNudges[0].pillar).toBe(PILLARS.MRA)
    expect(medNudges[0].title).toContain('MRA')
  })

  it('generates medication reminder nudge for UNDERDOSED pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const medNudges = nudges.filter((n) => n.type === 'medication_reminder')
    expect(medNudges.length).toBe(1)
    expect(medNudges[0].pillar).toBe(PILLARS.BETA_BLOCKER)
    expect(medNudges[0].title).toContain('dose adjustment')
  })

  it('generates lab_due nudge when STALE_LABS blocker present', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['STALE_LABS']),
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const labNudges = nudges.filter((n) => n.type === 'lab_due')
    expect(labNudges.length).toBe(1)
    expect(labNudges[0].priority).toBe('medium')
  })

  it('generates milestone celebration for ON_TARGET pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const milestones = nudges.filter((n) => n.type === 'milestone_celebration')
    expect(milestones.length).toBe(4)
    expect(milestones[0].priority).toBe('low')
    expect(milestones[0].title).toContain('on target')
  })

  it('always includes a lifestyle tip nudge', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const lifestyleNudges = nudges.filter((n) => n.type === 'lifestyle_tip')
    expect(lifestyleNudges.length).toBeGreaterThanOrEqual(1)
  })

  it('adds DM-specific lifestyle tips for diabetes domain', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.METFORMIN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.SGLT2i_DM, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.GLP1_RA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.INSULIN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.MEDIUM),
      ],
      { domainId: 'dm-mgmt' },
    )
    const patient = makePatient({ domainId: 'dm-mgmt' })

    const nudges = generateNudges(audit, patient)

    const lifestyleNudges = nudges.filter((n) => n.type === 'lifestyle_tip')
    // general + 3 DM-specific
    expect(lifestyleNudges.length).toBe(4)
    const dmNudges = lifestyleNudges.filter((n) => n.id.startsWith('nudge-dm'))
    expect(dmNudges.length).toBe(3)
  })

  it('adds HTN-specific lifestyle tips for hypertension domain', () => {
    const audit = makeAuditResult(
      [
        makePillarResult(PILLARS.ACEi_ARB_HTN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
        makePillarResult(PILLARS.CCB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
        makePillarResult(PILLARS.THIAZIDE, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.MEDIUM),
        makePillarResult(PILLARS.BETA_BLOCKER_HTN, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.MEDIUM),
      ],
      { domainId: 'htn-control' },
    )
    const patient = makePatient({ domainId: 'htn-control' })

    const nudges = generateNudges(audit, patient)

    const htnNudges = nudges.filter((n) => n.id.startsWith('nudge-htn'))
    expect(htnNudges.length).toBe(2)
  })

  it('sorts nudges by priority: high before medium before low', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['STALE_LABS']),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const priorities = nudges.map((n) => n.priority)
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

    for (let i = 1; i < priorities.length; i++) {
      expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i - 1]])
    }
  })

  it('generates unique IDs for each nudge', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.UNDERDOSED, DOSE_TIERS.LOW),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['STALE_LABS']),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const ids = nudges.map((n) => n.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all nudges have status pending', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    for (const nudge of nudges) {
      expect(nudge.status).toBe('pending')
    }
  })

  it('returns readonly array', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    expect(Array.isArray(nudges)).toBe(true)
  })

  it('generates only one lab_due nudge even with multiple STALE_LABS blockers', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['STALE_LABS']),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.MISSING, DOSE_TIERS.NOT_PRESCRIBED, ['STALE_LABS']),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const labNudges = nudges.filter((n) => n.type === 'lab_due')
    expect(labNudges.length).toBe(1)
  })

  it('does not generate medication nudge for CONTRAINDICATED pillar', () => {
    const audit = makeAuditResult([
      makePillarResult(PILLARS.ARNI_ACEi_ARB, PILLAR_STATUSES.CONTRAINDICATED, DOSE_TIERS.NOT_PRESCRIBED),
      makePillarResult(PILLARS.BETA_BLOCKER, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.MRA, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
      makePillarResult(PILLARS.SGLT2i, PILLAR_STATUSES.ON_TARGET, DOSE_TIERS.HIGH),
    ])
    const patient = makePatient()

    const nudges = generateNudges(audit, patient)

    const medNudges = nudges.filter((n) => n.type === 'medication_reminder')
    expect(medNudges.length).toBe(0)
  })
})
