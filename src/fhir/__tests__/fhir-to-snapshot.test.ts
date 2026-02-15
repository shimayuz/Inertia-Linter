import { describe, it, expect } from 'vitest'
import { fhirToSnapshot } from '../fhir-to-snapshot'
import { LOINC_CODES } from '../types'
import type {
  FHIRBundle,
  FHIRObservation,
  FHIRMedicationRequest,
  FHIRResource,
} from '../types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeObservation(
  loincCode: string,
  value: number,
  date: string,
): FHIRObservation {
  return {
    resourceType: 'Observation',
    id: `obs-${loincCode}-${date}`,
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: loincCode,
        },
      ],
    },
    effectiveDateTime: date,
    valueQuantity: {
      value,
    },
  }
}

function makeMedicationRequest(
  rxnorm: string,
  display: string,
  doseMg: number,
): FHIRMedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    id: `med-${rxnorm}`,
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: rxnorm,
        },
      ],
      text: display,
    },
    dosageInstruction: [
      {
        doseAndRate: [
          {
            doseQuantity: {
              value: doseMg,
              unit: 'mg',
            },
          },
        ],
      },
    ],
  }
}

function makeBundle(resources: ReadonlyArray<FHIRResource>): FHIRBundle {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: resources.map((resource) => ({
      resource,
    })),
  }
}

// ---------------------------------------------------------------------------
// Minimal valid bundle: LVEF + SBP + HR
// ---------------------------------------------------------------------------

function makeMinimalBundle(overrides: {
  readonly lvef?: number
  readonly sbp?: number
  readonly hr?: number
  readonly date?: string
} = {}): FHIRBundle {
  const date = overrides.date ?? '2026-02-01'
  return makeBundle([
    makeObservation(LOINC_CODES.LVEF, overrides.lvef ?? 30, date),
    makeObservation(LOINC_CODES.SBP, overrides.sbp ?? 120, date),
    makeObservation(LOINC_CODES.HEART_RATE, overrides.hr ?? 70, date),
  ])
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fhirToSnapshot', () => {
  describe('Vitals and labs extraction', () => {
    it('extracts vitals (LVEF, SBP, HR) and labs (eGFR, K+, BNP) from Observations', () => {
      const bundle = makeBundle([
        makeObservation(LOINC_CODES.LVEF, 30, '2026-02-01'),
        makeObservation(LOINC_CODES.SBP, 110, '2026-02-01'),
        makeObservation(LOINC_CODES.HEART_RATE, 72, '2026-02-01'),
        makeObservation(LOINC_CODES.EGFR, 55, '2026-01-28'),
        makeObservation(LOINC_CODES.POTASSIUM, 4.2, '2026-01-28'),
        makeObservation(LOINC_CODES.BNP, 450, '2026-01-28'),
      ])

      const snapshot = fhirToSnapshot(bundle)

      expect(snapshot.ef).toBe(30)
      expect(snapshot.sbp).toBe(110)
      expect(snapshot.hr).toBe(72)
      expect(snapshot.egfr).toBe(55)
      expect(snapshot.potassium).toBe(4.2)
      expect(snapshot.bnp).toBe(450)
      expect(snapshot.vitalsDate).toBe('2026-02-01')
      expect(snapshot.labsDate).toBe('2026-01-28')
    })
  })

  describe('Medication extraction', () => {
    it('extracts medications via RxNorm codes and maps to correct pillars + dose tiers', () => {
      const bundle = makeBundle([
        makeObservation(LOINC_CODES.LVEF, 25, '2026-02-01'),
        makeObservation(LOINC_CODES.SBP, 115, '2026-02-01'),
        makeObservation(LOINC_CODES.HEART_RATE, 68, '2026-02-01'),
        // Sacubitril/Valsartan 97mg BID -> ARNI_ACEi_ARB HIGH
        makeMedicationRequest('1656356', 'Sacubitril/Valsartan 97mg', 97),
        // Carvedilol 12.5mg BID -> BETA_BLOCKER MEDIUM
        makeMedicationRequest('20352', 'Carvedilol 12.5mg', 12.5),
        // Spironolactone 25mg daily -> MRA MEDIUM
        makeMedicationRequest('9997', 'Spironolactone 25mg', 25),
        // Dapagliflozin 10mg daily -> SGLT2i HIGH
        makeMedicationRequest('1488564', 'Dapagliflozin 10mg', 10),
      ])

      const snapshot = fhirToSnapshot(bundle)

      const arniAcei = snapshot.medications.find((m) => m.pillar === 'ARNI_ACEi_ARB')
      expect(arniAcei).toBeDefined()
      expect(arniAcei!.name).toBe('Sacubitril/Valsartan')
      expect(arniAcei!.doseTier).toBe('HIGH')

      const bb = snapshot.medications.find((m) => m.pillar === 'BETA_BLOCKER')
      expect(bb).toBeDefined()
      expect(bb!.name).toBe('Carvedilol')
      expect(bb!.doseTier).toBe('MEDIUM')

      const mra = snapshot.medications.find((m) => m.pillar === 'MRA')
      expect(mra).toBeDefined()
      expect(mra!.name).toBe('Spironolactone')
      expect(mra!.doseTier).toBe('MEDIUM')

      const sglt2i = snapshot.medications.find((m) => m.pillar === 'SGLT2i')
      expect(sglt2i).toBeDefined()
      expect(sglt2i!.name).toBe('Dapagliflozin')
      expect(sglt2i!.doseTier).toBe('HIGH')
    })
  })

  describe('Missing pillar fill', () => {
    it('fills NOT_PRESCRIBED for missing pillars (should always return 4 medications)', () => {
      // Only ARNI_ACEi_ARB is prescribed
      const bundle = makeBundle([
        makeObservation(LOINC_CODES.LVEF, 30, '2026-02-01'),
        makeObservation(LOINC_CODES.SBP, 120, '2026-02-01'),
        makeObservation(LOINC_CODES.HEART_RATE, 70, '2026-02-01'),
        makeMedicationRequest('1656354', 'Sacubitril/Valsartan 24mg', 24),
      ])

      const snapshot = fhirToSnapshot(bundle)

      expect(snapshot.medications).toHaveLength(4)

      const arniAcei = snapshot.medications.find((m) => m.pillar === 'ARNI_ACEi_ARB')
      expect(arniAcei!.doseTier).toBe('LOW')

      const notPrescribed = snapshot.medications.filter(
        (m) => m.doseTier === 'NOT_PRESCRIBED',
      )
      expect(notPrescribed).toHaveLength(3)

      const notPrescribedPillars = notPrescribed.map((m) => m.pillar).sort()
      expect(notPrescribedPillars).toEqual(
        ['BETA_BLOCKER', 'MRA', 'SGLT2i'].sort(),
      )
    })
  })

  describe('NYHA default', () => {
    it('defaults NYHA to 2 when not in bundle', () => {
      const snapshot = fhirToSnapshot(makeMinimalBundle())
      expect(snapshot.nyhaClass).toBe(2)
    })
  })

  describe('Required field validation', () => {
    it('throws if LVEF is missing', () => {
      const bundle = makeBundle([
        makeObservation(LOINC_CODES.SBP, 120, '2026-02-01'),
        makeObservation(LOINC_CODES.HEART_RATE, 70, '2026-02-01'),
      ])

      expect(() => fhirToSnapshot(bundle)).toThrow(/LVEF/i)
    })

    it('throws if SBP is missing', () => {
      const bundle = makeBundle([
        makeObservation(LOINC_CODES.LVEF, 30, '2026-02-01'),
        makeObservation(LOINC_CODES.HEART_RATE, 70, '2026-02-01'),
      ])

      expect(() => fhirToSnapshot(bundle)).toThrow(/SBP/i)
    })

    it('throws if Heart Rate is missing', () => {
      const bundle = makeBundle([
        makeObservation(LOINC_CODES.LVEF, 30, '2026-02-01'),
        makeObservation(LOINC_CODES.SBP, 120, '2026-02-01'),
      ])

      expect(() => fhirToSnapshot(bundle)).toThrow(/heart rate/i)
    })
  })

  describe('Duplicate observations', () => {
    it('uses most recent Observation when duplicates exist (by effectiveDateTime)', () => {
      const bundle = makeBundle([
        // Older LVEF = 45
        makeObservation(LOINC_CODES.LVEF, 45, '2026-01-01'),
        // Newer LVEF = 30 (should be used)
        makeObservation(LOINC_CODES.LVEF, 30, '2026-02-01'),
        // Older SBP = 140
        makeObservation(LOINC_CODES.SBP, 140, '2026-01-15'),
        // Newer SBP = 110 (should be used)
        makeObservation(LOINC_CODES.SBP, 110, '2026-02-01'),
        // Older HR = 90
        makeObservation(LOINC_CODES.HEART_RATE, 90, '2026-01-10'),
        // Newer HR = 68 (should be used)
        makeObservation(LOINC_CODES.HEART_RATE, 68, '2026-02-01'),
      ])

      const snapshot = fhirToSnapshot(bundle)

      expect(snapshot.ef).toBe(30)
      expect(snapshot.sbp).toBe(110)
      expect(snapshot.hr).toBe(68)
    })
  })
})
