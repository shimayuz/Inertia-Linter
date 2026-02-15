# FHIR Adapter + Extensible Domain Architecture

**Date**: 2026-02-14
**Status**: Approved
**Author**: Yusuke Fukushima MD + Claude Code
**Context**: Cerebral Valley AI Hackathon (Feb 2026)

## Problem

Inertia Linter currently only audits HF GDMT with manual data entry or image capture. Clinical inertia exists across many domains (ACS secondary prevention, diabetes management, CKD, etc.). The platform needs to demonstrate:

1. EHR integration readiness (FHIR R4 / Epic)
2. Extensibility to other clinical domains beyond HF

## Approach: Adapter Pattern

Keep the existing HF GDMT engine unchanged. Layer a `ClinicalDomain` interface and FHIR adapter on top.

```
FHIR Bundle --> FHIRAdapter --> PatientSnapshot --> [HF GDMT Engine] --> AuditResult
                                    |
                              (future) ACS Engine, DM Engine, etc.
```

### Why Adapter Pattern

- Zero refactoring of existing engine (210 tests preserved)
- Maximum demo impact in minimal time (1-2 days)
- ACS stub proves extensibility concept
- Future migration to generic engine remains possible

## FHIR Layer

### Directory Structure

```
src/fhir/
  types.ts                    # FHIR R4 minimal type definitions
  mock-bundles/
    patient-001.json          # Case 1 FHIR Bundle (HFrEF 68M)
    patient-002.json          # Case 2 FHIR Bundle (HFpEF 75F)
    patient-003.json          # Case 3 FHIR Bundle (HFrEF 72M)
  fhir-to-snapshot.ts         # Bundle -> PatientSnapshot (pure function)
  fhir-client.ts              # Mock fetch client
  __tests__/
    fhir-to-snapshot.test.ts  # Conversion tests
```

### FHIR Types (minimal)

- `FHIRBundle` -- type: "searchset", entry[]
- `FHIRPatient` -- name, birthDate, gender
- `FHIRObservation` -- code (LOINC), valueQuantity, effectiveDateTime
- `FHIRMedicationRequest` -- medicationCodeableConcept, dosageInstruction
- `FHIRCondition` -- code (ICD-10/SNOMED), clinicalStatus

### LOINC Mapping

| LOINC | Field | Description |
|-------|-------|-------------|
| 8867-4 | hr | Heart Rate |
| 8480-6 | sbp | Systolic BP |
| 33914-3 | egfr | eGFR (CKD-EPI) |
| 6298-4 | potassium | Serum K+ |
| 10230-1 | ef | LVEF |
| 42176-8 | bnp | BNP |

### RxNorm Medication Matching

Maps RxNorm codes to pillar + dose tier using a lookup table. Covers the drugs in target-doses.ts (Sacubitril/Valsartan, Carvedilol, Metoprolol, Spironolactone, Dapagliflozin, etc.).

### Mock Bundles

Static JSON files representing the 3 existing demo cases as FHIR Bundles. The mock client intercepts `/fhir/Patient/{id}/$everything` and returns the corresponding Bundle.

## ClinicalDomain Interface

```typescript
interface ClinicalDomain {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly pillars: ReadonlyArray<string>
  readonly applicableTo: (conditions: ReadonlyArray<FHIRCondition>) => boolean
  readonly transformBundle: (bundle: FHIRBundle) => PatientSnapshot
  readonly runAudit: (snapshot: PatientSnapshot) => AuditResult
}
```

### HF GDMT Domain

Wraps existing `runAudit` + new `fhirToSnapshot`. Registered as the default domain.

### ACS Secondary Prevention Stub

```typescript
{
  id: 'acs-secondary',
  name: 'ACS Secondary Prevention',
  pillars: ['HIGH_INTENSITY_STATIN', 'PCSK9_INHIBITOR', 'DAPT', 'BETA_BLOCKER', 'ACEi_ARB'],
  // transform and audit throw 'not yet implemented'
}
```

### Domain Registry

Simple array of registered domains. UI queries this to populate the domain selector.

## UI Integration

### EHR Connect Button

Located in Dashboard left panel, above ImageUpload. Clicking opens a patient list dialog.

### FHIR Patient List Dialog

Shows mock patients with basic info (name, age, conditions). Selecting a patient triggers:
1. Fetch FHIR Bundle
2. Transform to PatientSnapshot
3. Pre-fill PatientForm
4. Auto-run audit

### Domain Selector

Dropdown showing registered domains. Currently only HF GDMT is selectable. ACS shows as "Coming Soon" (disabled).

### FHIR Badge

When data source is FHIR, display "FHIR R4" badge on the data panel.

## Demo Flow

1. App startup
2. Click "EHR Connect"
3. Mock patient list appears (Demo Patient 001, 002, 003)
4. Select patient -> fetch FHIR $everything
5. Bundle -> PatientSnapshot auto-conversion
6. Form pre-filled (EF, vitals, labs, medications)
7. Auto audit -> results displayed
8. Badge: "Powered by FHIR R4 | Heart Failure GDMT Domain"

Manual input and image capture flows remain unchanged.

## Files

### New Files (13)

| File | Lines | Purpose |
|------|-------|---------|
| src/fhir/types.ts | ~80 | FHIR R4 type definitions |
| src/fhir/fhir-to-snapshot.ts | ~150 | Bundle to PatientSnapshot |
| src/fhir/fhir-client.ts | ~40 | Mock fetch client |
| src/fhir/mock-bundles/patient-001.json | ~200 | Case 1 FHIR Bundle |
| src/fhir/mock-bundles/patient-002.json | ~200 | Case 2 FHIR Bundle |
| src/fhir/mock-bundles/patient-003.json | ~200 | Case 3 FHIR Bundle |
| src/fhir/__tests__/fhir-to-snapshot.test.ts | ~120 | Conversion tests |
| src/domains/types.ts | ~30 | ClinicalDomain interface |
| src/domains/hf-gdmt/index.ts | ~30 | HF GDMT domain registration |
| src/domains/acs-secondary/index.ts | ~40 | ACS stub |
| src/domains/registry.ts | ~20 | Domain registry |
| src/components/EHRConnectButton.tsx | ~60 | EHR connect button |
| src/components/FHIRPatientList.tsx | ~100 | Patient selection dialog |

### Modified Files (2)

| File | Change |
|------|--------|
| Dashboard.tsx | Add EHR Connect button + domain selector |
| PatientForm.tsx | Accept FHIR pre-fill data |

### Unchanged

- src/engine/ -- all engine code preserved
- src/types/ -- all type definitions preserved
- src/data/ -- all data files preserved
- All 210 existing tests preserved

## Constraints

- Patient data from FHIR mock stays client-side (PHI protection maintained)
- No real EHR connection in hackathon demo
- API key for Claude Vision managed via .env only
- ACS domain is stub only (throws on actual use)

## Score Verification

All 3 demo cases must produce identical scores whether entered manually, via image capture, or via FHIR:

| Case | Score | Max | Normalized |
|------|-------|-----|------------|
| Case 1 | 24 | 100 | 24% |
| Case 2 | 0 | 25 | 0% |
| Case 3 | 49 | 100 | 49% |
