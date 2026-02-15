import { describe, it, expect } from 'vitest'
import { fhirToSnapshot } from '../fhir-to-snapshot.ts'
import { runAudit } from '../../engine/audit.ts'
import patient001 from '../mock-bundles/patient-001.json'
import patient002 from '../mock-bundles/patient-002.json'
import patient003 from '../mock-bundles/patient-003.json'
import type { FHIRBundle } from '../types.ts'

describe('FHIR-to-Audit round trip', () => {
  it('Case 1 (HFrEF 68M): FHIR bundle produces GDMT 24/100', () => {
    const snapshot = fhirToSnapshot(patient001 as unknown as FHIRBundle)
    const result = runAudit(snapshot)

    expect(result.efCategory).toBe('HFrEF')
    expect(result.gdmtScore.score).toBe(24)
    expect(result.gdmtScore.maxPossible).toBe(100)
    expect(result.gdmtScore.normalized).toBe(24)
  })

  it('Case 2 (HFpEF 75F): FHIR bundle produces correct HFpEF audit', () => {
    const snapshot = fhirToSnapshot(patient002 as unknown as FHIRBundle)
    const result = runAudit(snapshot)

    expect(result.efCategory).toBe('HFpEF')
    expect(result.gdmtScore.score).toBe(0)
    expect(result.gdmtScore.maxPossible).toBe(100)
    expect(result.gdmtScore.normalized).toBe(0)
  })

  it('Case 3 (HFrEF 72M): FHIR bundle produces GDMT 49/100', () => {
    const snapshot = fhirToSnapshot(patient003 as unknown as FHIRBundle)
    const result = runAudit(snapshot)

    expect(result.efCategory).toBe('HFrEF')
    expect(result.gdmtScore.score).toBe(49)
    expect(result.gdmtScore.maxPossible).toBe(100)
    expect(result.gdmtScore.normalized).toBe(49)
  })

  it('FHIR snapshot matches manual snapshot structure for Case 1', () => {
    const snapshot = fhirToSnapshot(patient001 as unknown as FHIRBundle)

    expect(snapshot.ef).toBe(30)
    expect(snapshot.sbp).toBe(118)
    expect(snapshot.hr).toBe(68)
    expect(snapshot.egfr).toBe(55)
    expect(snapshot.potassium).toBe(4.2)
    expect(snapshot.medications).toHaveLength(4)

    const acei = snapshot.medications.find((m) => m.pillar === 'ARNI_ACEi_ARB')
    expect(acei?.doseTier).toBe('LOW')

    const bb = snapshot.medications.find((m) => m.pillar === 'BETA_BLOCKER')
    expect(bb?.doseTier).toBe('MEDIUM')
  })

  it('FHIR snapshot matches manual snapshot structure for Case 3', () => {
    const snapshot = fhirToSnapshot(patient003 as unknown as FHIRBundle)

    expect(snapshot.ef).toBe(25)
    expect(snapshot.sbp).toBe(92)
    expect(snapshot.hr).toBe(72)
    expect(snapshot.egfr).toBe(28)
    expect(snapshot.potassium).toBe(5.3)
    expect(snapshot.medications).toHaveLength(4)

    const arniAcei = snapshot.medications.find((m) => m.pillar === 'ARNI_ACEi_ARB')
    expect(arniAcei?.doseTier).toBe('LOW')

    const bb = snapshot.medications.find((m) => m.pillar === 'BETA_BLOCKER')
    expect(bb?.doseTier).toBe('LOW')

    const mra = snapshot.medications.find((m) => m.pillar === 'MRA')
    expect(mra?.doseTier).toBe('LOW')

    const sglt2i = snapshot.medications.find((m) => m.pillar === 'SGLT2i')
    expect(sglt2i?.doseTier).toBe('HIGH')
  })
})
