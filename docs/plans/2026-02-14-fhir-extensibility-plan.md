# FHIR Adapter + Extensible Domain Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add FHIR mock integration and pluggable clinical domain architecture to demonstrate EHR readiness and multi-specialty extensibility.

**Architecture:** Adapter Pattern -- wrap the existing HF GDMT engine behind a `ClinicalDomain` interface. Add a FHIR adapter layer that converts FHIR R4 Bundles to `PatientSnapshot`. Mock FHIR client returns static Bundles for the 3 demo cases. ACS Secondary Prevention included as a stub to prove extensibility.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, existing pure-function engine (unchanged)

---

## Task 1: FHIR R4 Type Definitions

**Files:**
- Create: `src/fhir/types.ts`

**Step 1: Create the FHIR type definitions**

```typescript
// src/fhir/types.ts

export interface FHIRCoding {
  readonly system?: string
  readonly code: string
  readonly display?: string
}

export interface FHIRCodeableConcept {
  readonly coding?: ReadonlyArray<FHIRCoding>
  readonly text?: string
}

export interface FHIRQuantity {
  readonly value: number
  readonly unit?: string
  readonly system?: string
  readonly code?: string
}

export interface FHIRReference {
  readonly reference: string
  readonly display?: string
}

export interface FHIRPeriod {
  readonly start?: string
  readonly end?: string
}

export interface FHIRResource {
  readonly resourceType: string
  readonly id?: string
}

export interface FHIRPatient extends FHIRResource {
  readonly resourceType: 'Patient'
  readonly name?: ReadonlyArray<{
    readonly family?: string
    readonly given?: ReadonlyArray<string>
    readonly text?: string
  }>
  readonly gender?: 'male' | 'female' | 'other' | 'unknown'
  readonly birthDate?: string
}

export interface FHIRObservation extends FHIRResource {
  readonly resourceType: 'Observation'
  readonly code: FHIRCodeableConcept
  readonly valueQuantity?: FHIRQuantity
  readonly effectiveDateTime?: string
  readonly status: 'final' | 'preliminary' | 'amended' | 'corrected' | 'cancelled'
}

export interface FHIRDosage {
  readonly text?: string
  readonly doseAndRate?: ReadonlyArray<{
    readonly doseQuantity?: FHIRQuantity
  }>
  readonly timing?: {
    readonly repeat?: {
      readonly frequency?: number
      readonly period?: number
      readonly periodUnit?: string
    }
  }
}

export interface FHIRMedicationRequest extends FHIRResource {
  readonly resourceType: 'MedicationRequest'
  readonly medicationCodeableConcept?: FHIRCodeableConcept
  readonly status: 'active' | 'completed' | 'stopped' | 'cancelled' | 'draft'
  readonly dosageInstruction?: ReadonlyArray<FHIRDosage>
}

export interface FHIRCondition extends FHIRResource {
  readonly resourceType: 'Condition'
  readonly code?: FHIRCodeableConcept
  readonly clinicalStatus?: FHIRCodeableConcept
}

export interface FHIRBundleEntry {
  readonly resource: FHIRResource
  readonly fullUrl?: string
}

export interface FHIRBundle extends FHIRResource {
  readonly resourceType: 'Bundle'
  readonly type: 'searchset' | 'document' | 'collection' | 'transaction'
  readonly total?: number
  readonly entry?: ReadonlyArray<FHIRBundleEntry>
}

// LOINC codes for observations we extract
export const LOINC = {
  HEART_RATE: '8867-4',
  SBP: '8480-6',
  EGFR: '33914-3',
  POTASSIUM: '6298-4',
  LVEF: '10230-1',
  BNP: '42176-8',
} as const

// SNOMED/ICD codes for conditions
export const CONDITION_CODES = {
  HEART_FAILURE: ['84114007', 'I50', 'I50.2', 'I50.3', 'I50.4', 'I50.9'],
  ACS: ['394659003', 'I21', 'I21.0', 'I21.1', 'I21.2', 'I21.3', 'I21.4', 'I21.9'],
} as const
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 3: Commit**

```bash
git add src/fhir/types.ts
git commit -m "feat: add FHIR R4 type definitions with LOINC/SNOMED codes"
```

---

## Task 2: RxNorm Medication Lookup Table

**Files:**
- Create: `src/fhir/rxnorm-lookup.ts`

**Step 1: Create the RxNorm-to-pillar mapping**

This maps RxNorm codes to our Pillar + dose tier. Covers all drugs in `src/data/target-doses.ts`.

```typescript
// src/fhir/rxnorm-lookup.ts
import type { Pillar } from '../types/pillar.ts'
import type { DoseTier } from '../types/dose-tier.ts'

export interface RxNormMapping {
  readonly rxnorm: string
  readonly name: string
  readonly pillar: Pillar
  readonly doseMg: number
  readonly frequency: string
  readonly doseTier: DoseTier
}

// Each entry maps an RxNorm code + dose to a pillar and dose tier
const RXNORM_TABLE: ReadonlyArray<RxNormMapping> = [
  // --- ARNI ---
  { rxnorm: '1656354', name: 'Sacubitril/Valsartan 24/26mg', pillar: 'ARNI', doseMg: 24, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '1656355', name: 'Sacubitril/Valsartan 49/51mg', pillar: 'ARNI', doseMg: 49, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '1656356', name: 'Sacubitril/Valsartan 97/103mg', pillar: 'ARNI', doseMg: 97, frequency: 'BID', doseTier: 'HIGH' },

  // --- ACEi/ARB ---
  { rxnorm: '29046', name: 'Enalapril 2.5mg', pillar: 'ACEi_ARB', doseMg: 2.5, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '29046', name: 'Enalapril 5mg', pillar: 'ACEi_ARB', doseMg: 5, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '29046', name: 'Enalapril 10mg', pillar: 'ACEi_ARB', doseMg: 10, frequency: 'BID', doseTier: 'HIGH' },
  { rxnorm: '104377', name: 'Lisinopril 5mg', pillar: 'ACEi_ARB', doseMg: 5, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '104377', name: 'Lisinopril 20mg', pillar: 'ACEi_ARB', doseMg: 20, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '104377', name: 'Lisinopril 40mg', pillar: 'ACEi_ARB', doseMg: 40, frequency: 'daily', doseTier: 'HIGH' },
  { rxnorm: '52175', name: 'Losartan 50mg', pillar: 'ACEi_ARB', doseMg: 50, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '52175', name: 'Losartan 100mg', pillar: 'ACEi_ARB', doseMg: 100, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '52175', name: 'Losartan 150mg', pillar: 'ACEi_ARB', doseMg: 150, frequency: 'daily', doseTier: 'HIGH' },
  { rxnorm: '69749', name: 'Valsartan 40mg', pillar: 'ACEi_ARB', doseMg: 40, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '69749', name: 'Valsartan 80mg', pillar: 'ACEi_ARB', doseMg: 80, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '69749', name: 'Valsartan 160mg', pillar: 'ACEi_ARB', doseMg: 160, frequency: 'BID', doseTier: 'HIGH' },

  // --- Beta-blockers ---
  { rxnorm: '20352', name: 'Carvedilol 3.125mg', pillar: 'BETA_BLOCKER', doseMg: 3.125, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '20352', name: 'Carvedilol 6.25mg', pillar: 'BETA_BLOCKER', doseMg: 6.25, frequency: 'BID', doseTier: 'LOW' },
  { rxnorm: '20352', name: 'Carvedilol 12.5mg', pillar: 'BETA_BLOCKER', doseMg: 12.5, frequency: 'BID', doseTier: 'MEDIUM' },
  { rxnorm: '20352', name: 'Carvedilol 25mg', pillar: 'BETA_BLOCKER', doseMg: 25, frequency: 'BID', doseTier: 'HIGH' },
  { rxnorm: '866924', name: 'Metoprolol Succinate 25mg', pillar: 'BETA_BLOCKER', doseMg: 25, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '866924', name: 'Metoprolol Succinate 50mg', pillar: 'BETA_BLOCKER', doseMg: 50, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '866924', name: 'Metoprolol Succinate 200mg', pillar: 'BETA_BLOCKER', doseMg: 200, frequency: 'daily', doseTier: 'HIGH' },

  // --- MRA ---
  { rxnorm: '9997', name: 'Spironolactone 12.5mg', pillar: 'MRA', doseMg: 12.5, frequency: 'daily', doseTier: 'LOW' },
  { rxnorm: '9997', name: 'Spironolactone 25mg', pillar: 'MRA', doseMg: 25, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '9997', name: 'Spironolactone 50mg', pillar: 'MRA', doseMg: 50, frequency: 'daily', doseTier: 'HIGH' },
  { rxnorm: '298869', name: 'Eplerenone 25mg', pillar: 'MRA', doseMg: 25, frequency: 'daily', doseTier: 'MEDIUM' },
  { rxnorm: '298869', name: 'Eplerenone 50mg', pillar: 'MRA', doseMg: 50, frequency: 'daily', doseTier: 'HIGH' },

  // --- SGLT2i ---
  { rxnorm: '1488564', name: 'Dapagliflozin 10mg', pillar: 'SGLT2i', doseMg: 10, frequency: 'daily', doseTier: 'HIGH' },
  { rxnorm: '1545653', name: 'Empagliflozin 10mg', pillar: 'SGLT2i', doseMg: 10, frequency: 'daily', doseTier: 'HIGH' },
] as const

export function lookupMedication(
  rxnormCode: string,
  doseMg: number,
): RxNormMapping | undefined {
  // Find best match: same RxNorm code, closest dose
  const candidates = RXNORM_TABLE.filter((entry) => entry.rxnorm === rxnormCode)
  if (candidates.length === 0) return undefined

  let bestMatch = candidates[0]!
  let bestDiff = Math.abs(bestMatch.doseMg - doseMg)

  for (const candidate of candidates) {
    const diff = Math.abs(candidate.doseMg - doseMg)
    if (diff < bestDiff) {
      bestMatch = candidate
      bestDiff = diff
    }
  }

  return bestMatch
}

export function lookupMedicationByName(
  displayName: string,
): RxNormMapping | undefined {
  const lower = displayName.toLowerCase()
  return RXNORM_TABLE.find((entry) =>
    lower.includes(entry.name.toLowerCase().split(' ')[0]!)
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 3: Commit**

```bash
git add src/fhir/rxnorm-lookup.ts
git commit -m "feat: add RxNorm-to-pillar medication lookup table"
```

---

## Task 3: FHIR-to-PatientSnapshot Conversion (TDD)

**Files:**
- Create: `src/fhir/__tests__/fhir-to-snapshot.test.ts`
- Create: `src/fhir/fhir-to-snapshot.ts`

**Step 1: Write the failing tests**

```typescript
// src/fhir/__tests__/fhir-to-snapshot.test.ts
import { describe, it, expect } from 'vitest'
import { fhirToSnapshot } from '../fhir-to-snapshot.ts'
import type { FHIRBundle, FHIRObservation, FHIRMedicationRequest, FHIRCondition } from '../types.ts'
import { LOINC } from '../types.ts'

function makeObservation(loincCode: string, value: number, date: string): FHIRObservation {
  return {
    resourceType: 'Observation',
    id: `obs-${loincCode}`,
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: loincCode }],
    },
    valueQuantity: { value },
    effectiveDateTime: date,
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
    medicationCodeableConcept: {
      coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: rxnorm, display }],
    },
    dosageInstruction: [
      {
        doseAndRate: [{ doseQuantity: { value: doseMg, unit: 'mg' } }],
      },
    ],
  }
}

function makeCondition(code: string, display: string): FHIRCondition {
  return {
    resourceType: 'Condition',
    id: `cond-${code}`,
    code: {
      coding: [{ system: 'http://snomed.info/sct', code, display }],
    },
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
    },
  }
}

function makeBundle(resources: ReadonlyArray<{ resourceType: string }>): FHIRBundle {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: resources.length,
    entry: resources.map((resource) => ({ resource: resource as FHIRBundle['entry'][number]['resource'] })),
  }
}

describe('fhirToSnapshot', () => {
  it('extracts vitals from Observations', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.LVEF, 30, '2026-02-14'),
      makeObservation(LOINC.SBP, 118, '2026-02-14'),
      makeObservation(LOINC.HEART_RATE, 68, '2026-02-14'),
      makeObservation(LOINC.EGFR, 55, '2026-02-12'),
      makeObservation(LOINC.POTASSIUM, 4.2, '2026-02-12'),
      makeObservation(LOINC.BNP, 450, '2026-02-12'),
    ])

    const snapshot = fhirToSnapshot(bundle)

    expect(snapshot.ef).toBe(30)
    expect(snapshot.sbp).toBe(118)
    expect(snapshot.hr).toBe(68)
    expect(snapshot.egfr).toBe(55)
    expect(snapshot.potassium).toBe(4.2)
    expect(snapshot.bnp).toBe(450)
    expect(snapshot.vitalsDate).toBe('2026-02-14')
    expect(snapshot.labsDate).toBe('2026-02-12')
  })

  it('extracts medications and maps to pillars', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.LVEF, 30, '2026-02-14'),
      makeObservation(LOINC.SBP, 118, '2026-02-14'),
      makeObservation(LOINC.HEART_RATE, 68, '2026-02-14'),
      makeMedicationRequest('29046', 'Enalapril', 5),
      makeMedicationRequest('20352', 'Carvedilol', 12.5),
    ])

    const snapshot = fhirToSnapshot(bundle)

    const acei = snapshot.medications.find((m) => m.pillar === 'ACEi_ARB')
    expect(acei).toBeDefined()
    expect(acei!.doseTier).toBe('MEDIUM')
    expect(acei!.name).toContain('Enalapril')

    const bb = snapshot.medications.find((m) => m.pillar === 'BETA_BLOCKER')
    expect(bb).toBeDefined()
    expect(bb!.doseTier).toBe('MEDIUM')
  })

  it('fills NOT_PRESCRIBED for missing pillars', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.LVEF, 30, '2026-02-14'),
      makeObservation(LOINC.SBP, 118, '2026-02-14'),
      makeObservation(LOINC.HEART_RATE, 68, '2026-02-14'),
    ])

    const snapshot = fhirToSnapshot(bundle)

    expect(snapshot.medications).toHaveLength(5)
    for (const med of snapshot.medications) {
      expect(med.doseTier).toBe('NOT_PRESCRIBED')
    }
  })

  it('defaults NYHA to 2 when not in bundle', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.LVEF, 30, '2026-02-14'),
      makeObservation(LOINC.SBP, 118, '2026-02-14'),
      makeObservation(LOINC.HEART_RATE, 68, '2026-02-14'),
    ])

    const snapshot = fhirToSnapshot(bundle)
    expect(snapshot.nyhaClass).toBe(2)
  })

  it('throws if LVEF is missing', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.SBP, 118, '2026-02-14'),
      makeObservation(LOINC.HEART_RATE, 68, '2026-02-14'),
    ])

    expect(() => fhirToSnapshot(bundle)).toThrow('LVEF')
  })

  it('throws if SBP is missing', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.LVEF, 30, '2026-02-14'),
      makeObservation(LOINC.HEART_RATE, 68, '2026-02-14'),
    ])

    expect(() => fhirToSnapshot(bundle)).toThrow('SBP')
  })

  it('throws if Heart Rate is missing', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.LVEF, 30, '2026-02-14'),
      makeObservation(LOINC.SBP, 118, '2026-02-14'),
    ])

    expect(() => fhirToSnapshot(bundle)).toThrow('Heart Rate')
  })

  it('uses most recent observation when duplicates exist', () => {
    const bundle = makeBundle([
      makeObservation(LOINC.LVEF, 35, '2026-02-10'),
      makeObservation(LOINC.LVEF, 30, '2026-02-14'),
      makeObservation(LOINC.SBP, 118, '2026-02-14'),
      makeObservation(LOINC.HEART_RATE, 68, '2026-02-14'),
    ])

    const snapshot = fhirToSnapshot(bundle)
    expect(snapshot.ef).toBe(30)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/fhir/__tests__/fhir-to-snapshot.test.ts`
Expected: FAIL (module not found)

**Step 3: Write the implementation**

```typescript
// src/fhir/fhir-to-snapshot.ts
import type { FHIRBundle, FHIRObservation, FHIRMedicationRequest } from './types.ts'
import { LOINC } from './types.ts'
import type { PatientSnapshot, Medication } from '../types/patient.ts'
import type { Pillar } from '../types/pillar.ts'
import { PILLARS } from '../types/pillar.ts'
import { lookupMedication } from './rxnorm-lookup.ts'

interface ExtractedObs {
  readonly value: number
  readonly date: string
}

function extractObservations(
  bundle: FHIRBundle,
): ReadonlyMap<string, ExtractedObs> {
  const result = new Map<string, ExtractedObs>()

  for (const entry of bundle.entry ?? []) {
    if (entry.resource.resourceType !== 'Observation') continue
    const obs = entry.resource as FHIRObservation
    if (obs.status === 'cancelled') continue

    const loincCode = obs.code.coding?.find(
      (c) => c.system === 'http://loinc.org',
    )?.code
    if (!loincCode || obs.valueQuantity?.value === undefined) continue

    const date = obs.effectiveDateTime ?? ''
    const existing = result.get(loincCode)

    if (!existing || date > existing.date) {
      result.set(loincCode, { value: obs.valueQuantity.value, date })
    }
  }

  return result
}

function extractMedications(bundle: FHIRBundle): ReadonlyArray<Medication> {
  const pillarMeds = new Map<Pillar, Medication>()

  for (const entry of bundle.entry ?? []) {
    if (entry.resource.resourceType !== 'MedicationRequest') continue
    const medReq = entry.resource as FHIRMedicationRequest
    if (medReq.status !== 'active') continue

    const rxnormCode = medReq.medicationCodeableConcept?.coding?.find(
      (c) => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm',
    )?.code

    const display =
      medReq.medicationCodeableConcept?.coding?.[0]?.display ??
      medReq.medicationCodeableConcept?.text ??
      ''

    const doseMg =
      medReq.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.value ?? 0

    if (!rxnormCode) continue

    const mapping = lookupMedication(rxnormCode, doseMg)
    if (!mapping) continue

    const existing = pillarMeds.get(mapping.pillar)
    if (!existing || mapping.doseTier > (existing.doseTier ?? '')) {
      pillarMeds.set(mapping.pillar, {
        pillar: mapping.pillar,
        name: `${display} ${String(doseMg)}mg`,
        doseTier: mapping.doseTier,
      })
    }
  }

  return Object.values(PILLARS).map((pillar) =>
    pillarMeds.get(pillar) ?? {
      pillar,
      name: '',
      doseTier: 'NOT_PRESCRIBED' as const,
    },
  )
}

function requireObs(
  observations: ReadonlyMap<string, ExtractedObs>,
  code: string,
  label: string,
): ExtractedObs {
  const obs = observations.get(code)
  if (!obs) {
    throw new Error(`Required observation missing: ${label} (LOINC ${code})`)
  }
  return obs
}

export function fhirToSnapshot(bundle: FHIRBundle): PatientSnapshot {
  const observations = extractObservations(bundle)

  const lvef = requireObs(observations, LOINC.LVEF, 'LVEF')
  const sbp = requireObs(observations, LOINC.SBP, 'SBP')
  const hr = requireObs(observations, LOINC.HEART_RATE, 'Heart Rate')

  const egfr = observations.get(LOINC.EGFR)
  const potassium = observations.get(LOINC.POTASSIUM)
  const bnp = observations.get(LOINC.BNP)

  const vitalsDate = sbp.date > hr.date ? sbp.date : hr.date
  const labsDate = egfr?.date ?? potassium?.date

  const medications = extractMedications(bundle)

  return {
    ef: lvef.value,
    nyhaClass: 2,
    sbp: sbp.value,
    hr: hr.value,
    vitalsDate,
    egfr: egfr?.value,
    potassium: potassium?.value,
    labsDate,
    bnp: bnp?.value,
    medications,
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/fhir/__tests__/fhir-to-snapshot.test.ts`
Expected: 8 tests PASS

**Step 5: Run full suite to ensure no regressions**

Run: `npx tsc --noEmit && npm run test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/fhir/fhir-to-snapshot.ts src/fhir/__tests__/fhir-to-snapshot.test.ts
git commit -m "feat: add FHIR Bundle to PatientSnapshot conversion with tests"
```

---

## Task 4: FHIR Mock Bundles

**Files:**
- Create: `src/fhir/mock-bundles/patient-001.json`
- Create: `src/fhir/mock-bundles/patient-002.json`
- Create: `src/fhir/mock-bundles/patient-003.json`

These are static JSON files matching the 3 demo cases. Each is a FHIR Bundle containing a Patient, Observations (vitals + labs), MedicationRequests, and Conditions.

**Step 1: Create Case 1 Bundle** (68M HFrEF EF 30%)

Reference: `src/data/cases/case1.ts` -- EF 30, NYHA II, SBP 118, HR 68, eGFR 55, K+ 4.2, BNP 450, Enalapril 5mg, Carvedilol 12.5mg, SGLT2i ADR (UTI)

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 10,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "demo-001",
        "name": [{ "family": "Tanaka", "given": ["Hiroshi"], "text": "Hiroshi Tanaka" }],
        "gender": "male",
        "birthDate": "1958-03-15"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "cond-hf-001",
        "code": {
          "coding": [
            { "system": "http://snomed.info/sct", "code": "84114007", "display": "Heart failure" }
          ],
          "text": "Heart failure with reduced ejection fraction"
        },
        "clinicalStatus": {
          "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active" }]
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-lvef-001",
        "status": "final",
        "code": {
          "coding": [{ "system": "http://loinc.org", "code": "10230-1", "display": "Left ventricular Ejection fraction" }]
        },
        "valueQuantity": { "value": 30, "unit": "%", "system": "http://unitsofmeasure.org", "code": "%" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-sbp-001",
        "status": "final",
        "code": {
          "coding": [{ "system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure" }]
        },
        "valueQuantity": { "value": 118, "unit": "mmHg" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-hr-001",
        "status": "final",
        "code": {
          "coding": [{ "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }]
        },
        "valueQuantity": { "value": 68, "unit": "/min" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-egfr-001",
        "status": "final",
        "code": {
          "coding": [{ "system": "http://loinc.org", "code": "33914-3", "display": "eGFR" }]
        },
        "valueQuantity": { "value": 55, "unit": "mL/min/1.73m2" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-k-001",
        "status": "final",
        "code": {
          "coding": [{ "system": "http://loinc.org", "code": "6298-4", "display": "Potassium" }]
        },
        "valueQuantity": { "value": 4.2, "unit": "mmol/L" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-bnp-001",
        "status": "final",
        "code": {
          "coding": [{ "system": "http://loinc.org", "code": "42176-8", "display": "BNP" }]
        },
        "valueQuantity": { "value": 450, "unit": "pg/mL" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-enalapril-001",
        "status": "active",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "29046", "display": "Enalapril" }],
          "text": "Enalapril 5mg BID"
        },
        "dosageInstruction": [
          {
            "text": "5mg twice daily",
            "doseAndRate": [{ "doseQuantity": { "value": 5, "unit": "mg" } }],
            "timing": { "repeat": { "frequency": 2, "period": 1, "periodUnit": "d" } }
          }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-carvedilol-001",
        "status": "active",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "20352", "display": "Carvedilol" }],
          "text": "Carvedilol 12.5mg BID"
        },
        "dosageInstruction": [
          {
            "text": "12.5mg twice daily",
            "doseAndRate": [{ "doseQuantity": { "value": 12.5, "unit": "mg" } }],
            "timing": { "repeat": { "frequency": 2, "period": 1, "periodUnit": "d" } }
          }
        ]
      }
    }
  ]
}
```

**Step 2: Create Case 2 Bundle** (75F HFpEF EF 58%)

Reference: `src/data/cases/case2.ts` -- EF 58, NYHA II, SBP 142, HR 68, eGFR 45, K+ 4.8, BNP 220, DM type2, Valsartan 80mg

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 11,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "demo-002",
        "name": [{ "family": "Suzuki", "given": ["Yoko"], "text": "Yoko Suzuki" }],
        "gender": "female",
        "birthDate": "1951-07-22"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "cond-hf-002",
        "code": {
          "coding": [{ "system": "http://snomed.info/sct", "code": "84114007", "display": "Heart failure" }],
          "text": "Heart failure with preserved ejection fraction"
        },
        "clinicalStatus": {
          "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active" }]
        }
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "cond-dm-002",
        "code": {
          "coding": [{ "system": "http://snomed.info/sct", "code": "44054006", "display": "Diabetes mellitus type 2" }],
          "text": "Type 2 diabetes mellitus"
        },
        "clinicalStatus": {
          "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active" }]
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-lvef-002",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "10230-1", "display": "LVEF" }] },
        "valueQuantity": { "value": 58, "unit": "%" },
        "effectiveDateTime": "2026-02-10"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-sbp-002",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "8480-6", "display": "SBP" }] },
        "valueQuantity": { "value": 142, "unit": "mmHg" },
        "effectiveDateTime": "2026-02-10"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-hr-002",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }] },
        "valueQuantity": { "value": 68, "unit": "/min" },
        "effectiveDateTime": "2026-02-10"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-egfr-002",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "33914-3", "display": "eGFR" }] },
        "valueQuantity": { "value": 45, "unit": "mL/min/1.73m2" },
        "effectiveDateTime": "2026-02-08"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-k-002",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "6298-4", "display": "K+" }] },
        "valueQuantity": { "value": 4.8, "unit": "mmol/L" },
        "effectiveDateTime": "2026-02-08"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-bnp-002",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "42176-8", "display": "BNP" }] },
        "valueQuantity": { "value": 220, "unit": "pg/mL" },
        "effectiveDateTime": "2026-02-08"
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-valsartan-002",
        "status": "active",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "69749", "display": "Valsartan" }],
          "text": "Valsartan 80mg BID"
        },
        "dosageInstruction": [
          {
            "text": "80mg twice daily",
            "doseAndRate": [{ "doseQuantity": { "value": 80, "unit": "mg" } }],
            "timing": { "repeat": { "frequency": 2, "period": 1, "periodUnit": "d" } }
          }
        ]
      }
    }
  ]
}
```

**Step 3: Create Case 3 Bundle** (72M HFrEF EF 25%)

Reference: `src/data/cases/case3.ts` -- EF 25, NYHA III, SBP 92, HR 72, eGFR 28, K+ 5.3, BNP 1200, Sacubitril/Valsartan 24/26mg, Carvedilol 6.25mg, Spironolactone 12.5mg, Dapagliflozin 10mg

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 12,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "demo-003",
        "name": [{ "family": "Yamamoto", "given": ["Kenji"], "text": "Kenji Yamamoto" }],
        "gender": "male",
        "birthDate": "1954-11-08"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "cond-hf-003",
        "code": {
          "coding": [{ "system": "http://snomed.info/sct", "code": "84114007", "display": "Heart failure" }],
          "text": "Heart failure with reduced ejection fraction"
        },
        "clinicalStatus": {
          "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active" }]
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-lvef-003",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "10230-1", "display": "LVEF" }] },
        "valueQuantity": { "value": 25, "unit": "%" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-sbp-003",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "8480-6", "display": "SBP" }] },
        "valueQuantity": { "value": 92, "unit": "mmHg" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-hr-003",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }] },
        "valueQuantity": { "value": 72, "unit": "/min" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-egfr-003",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "33914-3", "display": "eGFR" }] },
        "valueQuantity": { "value": 28, "unit": "mL/min/1.73m2" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-k-003",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "6298-4", "display": "K+" }] },
        "valueQuantity": { "value": 5.3, "unit": "mmol/L" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-bnp-003",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "42176-8", "display": "BNP" }] },
        "valueQuantity": { "value": 1200, "unit": "pg/mL" },
        "effectiveDateTime": "2026-02-14"
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-entresto-003",
        "status": "active",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "1656354", "display": "Sacubitril/Valsartan" }],
          "text": "Entresto 24/26mg BID"
        },
        "dosageInstruction": [
          { "doseAndRate": [{ "doseQuantity": { "value": 24, "unit": "mg" } }] }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-carvedilol-003",
        "status": "active",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "20352", "display": "Carvedilol" }],
          "text": "Carvedilol 6.25mg BID"
        },
        "dosageInstruction": [
          { "doseAndRate": [{ "doseQuantity": { "value": 6.25, "unit": "mg" } }] }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-spironolactone-003",
        "status": "active",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "9997", "display": "Spironolactone" }],
          "text": "Spironolactone 12.5mg daily"
        },
        "dosageInstruction": [
          { "doseAndRate": [{ "doseQuantity": { "value": 12.5, "unit": "mg" } }] }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-dapagliflozin-003",
        "status": "active",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "1488564", "display": "Dapagliflozin" }],
          "text": "Dapagliflozin 10mg daily"
        },
        "dosageInstruction": [
          { "doseAndRate": [{ "doseQuantity": { "value": 10, "unit": "mg" } }] }
        ]
      }
    }
  ]
}
```

**Step 4: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 5: Commit**

```bash
git add src/fhir/mock-bundles/
git commit -m "feat: add FHIR mock bundles for 3 demo cases"
```

---

## Task 5: FHIR Mock Client

**Files:**
- Create: `src/fhir/fhir-client.ts`

**Step 1: Create mock FHIR client**

```typescript
// src/fhir/fhir-client.ts
import type { FHIRBundle } from './types.ts'

export interface FHIRPatientSummary {
  readonly id: string
  readonly name: string
  readonly age: number
  readonly gender: string
  readonly condition: string
}

const MOCK_PATIENTS: ReadonlyArray<FHIRPatientSummary> = [
  {
    id: 'demo-001',
    name: 'Hiroshi Tanaka',
    age: 68,
    gender: 'Male',
    condition: 'HFrEF (EF 30%)',
  },
  {
    id: 'demo-002',
    name: 'Yoko Suzuki',
    age: 75,
    gender: 'Female',
    condition: 'HFpEF (EF 58%) + DM2',
  },
  {
    id: 'demo-003',
    name: 'Kenji Yamamoto',
    age: 72,
    gender: 'Male',
    condition: 'HFrEF (EF 25%)',
  },
]

const bundleCache = new Map<string, FHIRBundle>()

async function loadBundle(patientId: string): Promise<FHIRBundle> {
  const cached = bundleCache.get(patientId)
  if (cached) return cached

  const response = await import(`./mock-bundles/${patientId}.json`)
  const bundle = response.default as FHIRBundle
  bundleCache.set(patientId, bundle)
  return bundle
}

export function listPatients(): ReadonlyArray<FHIRPatientSummary> {
  return MOCK_PATIENTS
}

export async function fetchPatientEverything(
  patientId: string,
): Promise<FHIRBundle> {
  const idMap: Readonly<Record<string, string>> = {
    'demo-001': 'patient-001',
    'demo-002': 'patient-002',
    'demo-003': 'patient-003',
  }

  const fileId = idMap[patientId]
  if (!fileId) {
    throw new Error(`Unknown patient ID: ${patientId}`)
  }

  return loadBundle(fileId)
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/fhir/fhir-client.ts
git commit -m "feat: add mock FHIR client with patient list and $everything"
```

---

## Task 6: ClinicalDomain Interface + Registry

**Files:**
- Create: `src/domains/types.ts`
- Create: `src/domains/hf-gdmt/index.ts`
- Create: `src/domains/acs-secondary/index.ts`
- Create: `src/domains/registry.ts`

**Step 1: Create domain interface**

```typescript
// src/domains/types.ts
import type { FHIRBundle, FHIRCondition } from '../fhir/types.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { AuditResult } from '../types/audit.ts'

export interface ClinicalDomain {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly pillars: ReadonlyArray<string>
  readonly status: 'active' | 'stub'
  readonly applicableTo: (conditions: ReadonlyArray<FHIRCondition>) => boolean
  readonly transformBundle: (bundle: FHIRBundle) => PatientSnapshot
  readonly runAudit: (snapshot: PatientSnapshot) => AuditResult
}
```

**Step 2: Create HF GDMT domain**

```typescript
// src/domains/hf-gdmt/index.ts
import type { ClinicalDomain } from '../types.ts'
import type { FHIRCondition } from '../../fhir/types.ts'
import { CONDITION_CODES } from '../../fhir/types.ts'
import { fhirToSnapshot } from '../../fhir/fhir-to-snapshot.ts'
import { runAudit } from '../../engine/audit.ts'

function isHeartFailureCondition(condition: FHIRCondition): boolean {
  const codes = condition.code?.coding ?? []
  return codes.some((c) =>
    (CONDITION_CODES.HEART_FAILURE as readonly string[]).includes(c.code),
  )
}

export const HF_GDMT_DOMAIN: ClinicalDomain = {
  id: 'hf-gdmt',
  name: 'Heart Failure GDMT',
  version: '2.0.0',
  description: 'Detects GDMT optimization gaps for HFrEF, HFmrEF, and HFpEF',
  pillars: ['ARNI', 'ACEi_ARB', 'BETA_BLOCKER', 'MRA', 'SGLT2i'],
  status: 'active',
  applicableTo: (conditions) => conditions.some(isHeartFailureCondition),
  transformBundle: fhirToSnapshot,
  runAudit,
}
```

**Step 3: Create ACS stub domain**

```typescript
// src/domains/acs-secondary/index.ts
import type { ClinicalDomain } from '../types.ts'
import type { FHIRCondition } from '../../fhir/types.ts'
import { CONDITION_CODES } from '../../fhir/types.ts'

function isACSCondition(condition: FHIRCondition): boolean {
  const codes = condition.code?.coding ?? []
  return codes.some((c) =>
    (CONDITION_CODES.ACS as readonly string[]).includes(c.code),
  )
}

export const ACS_SECONDARY_DOMAIN: ClinicalDomain = {
  id: 'acs-secondary',
  name: 'ACS Secondary Prevention',
  version: '0.1.0-stub',
  description:
    'Statin titration, PCSK9-I introduction, antiplatelet optimization for post-ACS patients',
  pillars: [
    'HIGH_INTENSITY_STATIN',
    'PCSK9_INHIBITOR',
    'DAPT',
    'BETA_BLOCKER',
    'ACEi_ARB',
  ],
  status: 'stub',
  applicableTo: (conditions) => conditions.some(isACSCondition),
  transformBundle: () => {
    throw new Error('ACS Secondary Prevention domain is not yet implemented')
  },
  runAudit: () => {
    throw new Error('ACS Secondary Prevention domain is not yet implemented')
  },
}
```

**Step 4: Create domain registry**

```typescript
// src/domains/registry.ts
import type { ClinicalDomain } from './types.ts'
import { HF_GDMT_DOMAIN } from './hf-gdmt/index.ts'
import { ACS_SECONDARY_DOMAIN } from './acs-secondary/index.ts'

export const DOMAIN_REGISTRY: ReadonlyArray<ClinicalDomain> = [
  HF_GDMT_DOMAIN,
  ACS_SECONDARY_DOMAIN,
]

export function getDomain(id: string): ClinicalDomain | undefined {
  return DOMAIN_REGISTRY.find((d) => d.id === id)
}

export function getActiveDomains(): ReadonlyArray<ClinicalDomain> {
  return DOMAIN_REGISTRY.filter((d) => d.status === 'active')
}
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 6: Commit**

```bash
git add src/domains/
git commit -m "feat: add ClinicalDomain interface with HF GDMT + ACS stub registry"
```

---

## Task 7: EHR Connect Hook

**Files:**
- Create: `src/hooks/useFHIRConnect.ts`

**Step 1: Create the FHIR connection hook**

```typescript
// src/hooks/useFHIRConnect.ts
import { useState, useCallback } from 'react'
import type { PatientSnapshot } from '../types/patient.ts'
import type { FHIRPatientSummary } from '../fhir/fhir-client.ts'
import { listPatients, fetchPatientEverything } from '../fhir/fhir-client.ts'
import { fhirToSnapshot } from '../fhir/fhir-to-snapshot.ts'

interface FHIRConnectState {
  readonly isOpen: boolean
  readonly isLoading: boolean
  readonly error: string | null
  readonly patients: ReadonlyArray<FHIRPatientSummary>
  readonly selectedPatientId: string | null
}

export function useFHIRConnect() {
  const [state, setState] = useState<FHIRConnectState>({
    isOpen: false,
    isLoading: false,
    error: null,
    patients: [],
    selectedPatientId: null,
  })

  const open = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      error: null,
      patients: listPatients(),
    }))
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      error: null,
      selectedPatientId: null,
    }))
  }, [])

  const selectPatient = useCallback(
    async (patientId: string): Promise<PatientSnapshot | null> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        selectedPatientId: patientId,
      }))

      try {
        const bundle = await fetchPatientEverything(patientId)
        const snapshot = fhirToSnapshot(bundle)

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isOpen: false,
        }))

        return snapshot
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load patient data'
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
        return null
      }
    },
    [],
  )

  return {
    ...state,
    open,
    close,
    selectPatient,
  } as const
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/hooks/useFHIRConnect.ts
git commit -m "feat: add useFHIRConnect hook for FHIR patient selection"
```

---

## Task 8: FHIR Patient List Dialog Component

**Files:**
- Create: `src/components/FHIRPatientList.tsx`

**Step 1: Create the patient list dialog**

```tsx
// src/components/FHIRPatientList.tsx
import { useCallback } from 'react'
import type { FHIRPatientSummary } from '../fhir/fhir-client.ts'

interface FHIRPatientListProps {
  readonly isOpen: boolean
  readonly patients: ReadonlyArray<FHIRPatientSummary>
  readonly isLoading: boolean
  readonly error: string | null
  readonly selectedPatientId: string | null
  readonly onSelect: (patientId: string) => void
  readonly onClose: () => void
}

export function FHIRPatientList({
  isOpen,
  patients,
  isLoading,
  error,
  selectedPatientId,
  onSelect,
  onClose,
}: FHIRPatientListProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Select patient from EHR"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              EHR Patient List
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              FHIR R4 Mock Server
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 tracking-wide">
            FHIR R4
          </span>
        </div>

        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {patients.map((patient) => {
            const isSelected = selectedPatientId === patient.id
            const isDisabled = isLoading && !isSelected

            return (
              <button
                key={patient.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelect(patient.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                  isSelected && isLoading
                    ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
                    : isDisabled
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {patient.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {patient.age}y {patient.gender}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-100">
                      {patient.condition}
                    </span>
                  </div>
                </div>
                {isSelected && isLoading && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    <span className="text-xs text-blue-600">
                      Loading from FHIR...
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="px-5 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/components/FHIRPatientList.tsx
git commit -m "feat: add FHIR patient list dialog component"
```

---

## Task 9: EHR Connect Button Component

**Files:**
- Create: `src/components/EHRConnectButton.tsx`

**Step 1: Create the EHR connect button**

```tsx
// src/components/EHRConnectButton.tsx

interface EHRConnectButtonProps {
  readonly onClick: () => void
  readonly dataSource: 'manual' | 'fhir' | 'vision'
}

export function EHRConnectButton({ onClick, dataSource }: EHRConnectButtonProps) {
  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 px-4 py-3 text-sm font-medium text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.364-3.07a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757"
          />
        </svg>
        EHR Connect
      </button>
      {dataSource === 'fhir' && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-600 border border-teal-200">
            FHIR R4
          </span>
          <span className="text-[10px] text-gray-400">
            Data loaded from EHR
          </span>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/components/EHRConnectButton.tsx
git commit -m "feat: add EHR Connect button component"
```

---

## Task 10: Domain Selector Component

**Files:**
- Create: `src/components/DomainSelector.tsx`

**Step 1: Create the domain selector**

```tsx
// src/components/DomainSelector.tsx
import { DOMAIN_REGISTRY } from '../domains/registry.ts'

interface DomainSelectorProps {
  readonly selectedDomainId: string
}

export function DomainSelector({ selectedDomainId }: DomainSelectorProps) {
  return (
    <div className="mb-3 px-1">
      <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
        Clinical Domain
      </label>
      <div className="space-y-1">
        {DOMAIN_REGISTRY.map((domain) => (
          <div
            key={domain.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
              domain.id === selectedDomainId
                ? 'bg-violet-50 border border-violet-200 text-violet-700'
                : domain.status === 'stub'
                  ? 'bg-gray-50 border border-gray-100 text-gray-400'
                  : 'bg-white border border-gray-100 text-gray-600'
            }`}
          >
            <span className="font-medium">{domain.name}</span>
            {domain.status === 'stub' ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">
                Coming Soon
              </span>
            ) : domain.id === selectedDomainId ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 font-bold">
                Active
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/components/DomainSelector.tsx
git commit -m "feat: add domain selector component with active/stub indicators"
```

---

## Task 11: Dashboard Integration

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Integrate EHR Connect, FHIR Patient List, and Domain Selector into Dashboard**

Additions to Dashboard.tsx:
1. Import new components and hooks
2. Add `useFHIRConnect` hook
3. Add `dataSource` state to track where data came from
4. Add EHR Connect button before ImageUpload
5. Add FHIRPatientList dialog
6. Add DomainSelector below ImageUpload
7. On FHIR patient select: load snapshot into form and auto-run audit

```typescript
// Add these imports at top of Dashboard.tsx:
import { EHRConnectButton } from './EHRConnectButton.tsx'
import { FHIRPatientList } from './FHIRPatientList.tsx'
import { DomainSelector } from './DomainSelector.tsx'
import { useFHIRConnect } from '../hooks/useFHIRConnect.ts'
```

Add state inside Dashboard function (after existing useState calls):

```typescript
const [dataSource, setDataSource] = useState<'manual' | 'fhir' | 'vision'>('manual')
const fhir = useFHIRConnect()

const handleFHIRSelect = useCallback(async (patientId: string) => {
  const snapshot = await fhir.selectPatient(patientId)
  if (snapshot) {
    setDataSource('fhir')
    handleAudit(snapshot)
  }
}, [fhir, handleAudit])
```

Replace the left pane content. Before ImageUpload, add:

```tsx
<EHRConnectButton onClick={fhir.open} dataSource={dataSource} />
```

After ImageUpload, add:

```tsx
<DomainSelector selectedDomainId="hf-gdmt" />
```

After the closing `</div>` of the main layout, add the FHIR dialog:

```tsx
<FHIRPatientList
  isOpen={fhir.isOpen}
  patients={fhir.patients}
  isLoading={fhir.isLoading}
  error={fhir.error}
  selectedPatientId={fhir.selectedPatientId}
  onSelect={handleFHIRSelect}
  onClose={fhir.close}
/>
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Run dev server and verify visual**

Run: `npm run dev`
Expected: EHR Connect button visible, clicking opens patient list, selecting patient runs audit

**Step 4: Run full test suite**

Run: `npm run test`
Expected: All existing tests pass (no regressions)

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: integrate EHR Connect, FHIR patient list, and domain selector into Dashboard"
```

---

## Task 12: Integration Test — FHIR-to-Audit Round Trip

**Files:**
- Create: `src/fhir/__tests__/fhir-integration.test.ts`

**Step 1: Write integration test verifying FHIR bundles produce correct audit scores**

```typescript
// src/fhir/__tests__/fhir-integration.test.ts
import { describe, it, expect } from 'vitest'
import { fhirToSnapshot } from '../fhir-to-snapshot.ts'
import { runAudit } from '../../engine/audit.ts'
import patient001 from '../mock-bundles/patient-001.json'
import patient002 from '../mock-bundles/patient-002.json'
import patient003 from '../mock-bundles/patient-003.json'
import type { FHIRBundle } from '../types.ts'

describe('FHIR-to-Audit round trip', () => {
  it('Case 1 (HFrEF 68M): FHIR bundle produces GDMT 24/100', () => {
    const snapshot = fhirToSnapshot(patient001 as FHIRBundle)
    const result = runAudit(snapshot)

    expect(result.efCategory).toBe('HFrEF')
    expect(result.gdmtScore.score).toBe(24)
    expect(result.gdmtScore.maxPossible).toBe(100)
    expect(result.gdmtScore.normalized).toBe(24)
  })

  it('Case 2 (HFpEF 75F): FHIR bundle produces correct HFpEF audit', () => {
    const snapshot = fhirToSnapshot(patient002 as FHIRBundle)
    const result = runAudit(snapshot)

    expect(result.efCategory).toBe('HFpEF')
    expect(result.gdmtScore.score).toBe(0)
    expect(result.gdmtScore.maxPossible).toBe(25)
    expect(result.gdmtScore.normalized).toBe(0)
  })

  it('Case 3 (HFrEF 72M): FHIR bundle produces GDMT 49/100', () => {
    const snapshot = fhirToSnapshot(patient003 as FHIRBundle)
    const result = runAudit(snapshot)

    expect(result.efCategory).toBe('HFrEF')
    expect(result.gdmtScore.score).toBe(49)
    expect(result.gdmtScore.maxPossible).toBe(100)
    expect(result.gdmtScore.normalized).toBe(49)
  })

  it('FHIR snapshot matches manual snapshot structure for Case 1', () => {
    const snapshot = fhirToSnapshot(patient001 as FHIRBundle)

    expect(snapshot.ef).toBe(30)
    expect(snapshot.sbp).toBe(118)
    expect(snapshot.hr).toBe(68)
    expect(snapshot.egfr).toBe(55)
    expect(snapshot.potassium).toBe(4.2)
    expect(snapshot.medications).toHaveLength(5)

    const acei = snapshot.medications.find((m) => m.pillar === 'ACEi_ARB')
    expect(acei?.doseTier).toBe('MEDIUM')

    const bb = snapshot.medications.find((m) => m.pillar === 'BETA_BLOCKER')
    expect(bb?.doseTier).toBe('MEDIUM')
  })
})
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/fhir/__tests__/fhir-integration.test.ts`
Expected: 4 tests PASS

**Step 3: Run full test suite**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: All tests pass, build succeeds

**Step 4: Commit**

```bash
git add src/fhir/__tests__/fhir-integration.test.ts
git commit -m "test: add FHIR-to-audit round-trip integration tests for all 3 demo cases"
```

---

## Task 13: Final Verification

**Step 1: Full verification**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: TypeScript clean, all tests pass (210 existing + ~12 new), build succeeds

**Step 2: Manual verification checklist**

Run: `npm run dev`
Verify:
- [ ] EHR Connect button visible above ImageUpload
- [ ] Clicking opens patient list dialog with 3 patients
- [ ] Selecting patient loads data and auto-runs audit
- [ ] FHIR R4 badge appears after loading from EHR
- [ ] Domain selector shows "Heart Failure GDMT (Active)" and "ACS Secondary Prevention (Coming Soon)"
- [ ] Image upload still works
- [ ] Manual form entry still works
- [ ] Demo case buttons still work
- [ ] All 3 demo cases produce same scores via FHIR as via manual entry

**Step 3: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: final adjustments for FHIR extensibility feature"
```

---

## Summary

| Task | Description | Files | Test? |
|------|------------|-------|-------|
| 1 | FHIR R4 type definitions | 1 new | - |
| 2 | RxNorm medication lookup | 1 new | - |
| 3 | FHIR-to-Snapshot conversion | 2 new | TDD |
| 4 | FHIR mock bundles (3 cases) | 3 new | - |
| 5 | FHIR mock client | 1 new | - |
| 6 | ClinicalDomain + registry | 4 new | - |
| 7 | useFHIRConnect hook | 1 new | - |
| 8 | FHIRPatientList dialog | 1 new | - |
| 9 | EHRConnectButton | 1 new | - |
| 10 | DomainSelector | 1 new | - |
| 11 | Dashboard integration | 1 modified | - |
| 12 | Integration tests | 1 new | TDD |
| 13 | Final verification | - | Manual |

**Total: 17 new files, 1 modified file, 0 existing files broken**
**Existing engine: unchanged, 210 tests preserved**
