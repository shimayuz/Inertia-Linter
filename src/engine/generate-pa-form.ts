import type { Pillar } from '../types/pillar.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { AuditResult } from '../types/audit.ts'
import type { PAFormData } from '../types/resolution.ts'
import { PA_TEMPLATES, fillTemplate } from '../data/pa-form-templates.ts'
import { getICD10ForEF } from '../data/icd10-hf-codes.ts'
import { classifyEF } from './classify-ef.ts'

// ---------------------------------------------------------------------------
// Drug name lookup per pillar
// ---------------------------------------------------------------------------

const DEFAULT_DRUG_NAMES: Readonly<Record<Pillar, string>> = {
  ARNI_ACEi_ARB: 'Sacubitril/Valsartan (Entresto)',
  BETA_BLOCKER: 'Carvedilol',
  MRA: 'Spironolactone',
  SGLT2i: 'Dapagliflozin (Farxiga)',
} as const

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function generatePAForm(
  pillar: Pillar,
  snapshot: PatientSnapshot,
  auditResult: AuditResult,
): PAFormData {
  const efCategory = classifyEF(snapshot.ef)
  const icd10 = getICD10ForEF(efCategory)
  const template = PA_TEMPLATES[pillar]
  const medication = snapshot.medications.find((m) => m.pillar === pillar)
  const drugName = medication?.name || DEFAULT_DRUG_NAMES[pillar]

  const pillarResult = auditResult.pillarResults.find((r) => r.pillar === pillar)
  const doseTier = pillarResult?.doseTier ?? 'NOT_PRESCRIBED'

  const clinicalJustification = fillTemplate(template.justificationTemplate, {
    ef: snapshot.ef,
    nyha: snapshot.nyhaClass,
    egfr: snapshot.egfr ?? 0,
    potassium: snapshot.potassium ?? 0,
  })

  const relevantLabs: Array<PAFormData['relevantLabs'][number]> = []
  const labDate = snapshot.labsDate ?? new Date().toISOString().slice(0, 10)

  if (snapshot.egfr !== undefined) {
    relevantLabs.push({ name: 'eGFR', value: snapshot.egfr, unit: 'mL/min/1.73m2', date: labDate })
  }
  if (snapshot.potassium !== undefined) {
    relevantLabs.push({ name: 'Potassium', value: snapshot.potassium, unit: 'mEq/L', date: labDate })
  }
  if (snapshot.bnp !== undefined) {
    relevantLabs.push({ name: 'BNP', value: snapshot.bnp, unit: 'pg/mL', date: labDate })
  }
  if (snapshot.ntProBnp !== undefined) {
    relevantLabs.push({ name: 'NT-proBNP', value: snapshot.ntProBnp, unit: 'pg/mL', date: labDate })
  }

  const priorTrials = snapshot.resolutionContext?.priorTrials?.filter(
    (t) => t.pillar === pillar,
  ) ?? []

  return {
    id: `pa-${pillar}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: new Date().toISOString(),
    status: 'draft',
    requestedDrug: drugName,
    requestedDrugPillar: pillar,
    requestedDoseTier: doseTier === 'NOT_PRESCRIBED' ? 'LOW' : doseTier,
    diagnosisCode: icd10.code,
    diagnosisDescription: icd10.description,
    efPercent: snapshot.ef,
    nyhaClass: snapshot.nyhaClass,
    clinicalJustification,
    guidelineReference: template.guidelineReference,
    guidelineClass: template.guidelineClass,
    priorTrials,
    relevantLabs,
    insurance: snapshot.resolutionContext?.insurance ?? {},
    prescriber: snapshot.resolutionContext?.prescriber ?? {},
  }
}
