import type {
  PatientSnapshot,
  AuditResult,
  PillarResult,
  GDMTScore,
  Pillar,
  BlockerCode,
  DoseTier,
  Medication,
} from '../../types/index.ts'
import { PILLARS } from '../../types/index.ts'
import { detectStaleData } from '../../engine/detect-stale.ts'

const DM_PILLARS: ReadonlyArray<Pillar> = [
  PILLARS.METFORMIN,
  PILLARS.SGLT2i_DM,
  PILLARS.GLP1_RA,
  PILLARS.INSULIN,
]

const MAX_POINTS_PER_PILLAR = 25

const DM_PILLAR_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  METFORMIN: 'Metformin',
  SGLT2i_DM: 'SGLT2i',
  GLP1_RA: 'GLP-1 RA',
  INSULIN: 'Insulin',
}

// ---------------------------------------------------------------------------
// Category classification
// ---------------------------------------------------------------------------

type DMCategory = 'DM_CONTROLLED' | 'DM_TYPE2_CKD' | 'DM_TYPE2_CVD' | 'DM_TYPE2'

const DM_CATEGORY_LABELS: Readonly<Record<DMCategory, string>> = {
  DM_CONTROLLED: 'Type 2 DM (Controlled)',
  DM_TYPE2_CKD: 'Type 2 DM with CKD',
  DM_TYPE2_CVD: 'Type 2 DM with CVD Risk',
  DM_TYPE2: 'Type 2 DM',
}

function classifyDMCategory(patient: PatientSnapshot): DMCategory {
  const hba1c = patient.hba1c ?? 0

  if (hba1c < 7.0) {
    return 'DM_CONTROLLED'
  }

  if (patient.ckd === true) {
    return 'DM_TYPE2_CKD'
  }

  if (patient.cvdRisk === true) {
    return 'DM_TYPE2_CVD'
  }

  return 'DM_TYPE2'
}

// ---------------------------------------------------------------------------
// Medication helpers
// ---------------------------------------------------------------------------

function findMedication(
  medications: ReadonlyArray<Medication>,
  pillar: Pillar,
): Medication | undefined {
  return medications.find(
    (med) => med.pillar === pillar && med.doseTier !== 'NOT_PRESCRIBED',
  )
}

function getDoseTierPoints(tier: DoseTier): number {
  const points: Readonly<Record<DoseTier, number>> = {
    NOT_PRESCRIBED: 0,
    LOW: 8,
    MEDIUM: 16,
    HIGH: 25,
  }
  return points[tier]
}

// ---------------------------------------------------------------------------
// Common blocker checks (shared across pillars)
// ---------------------------------------------------------------------------

function checkADRHistory(patient: PatientSnapshot, pillar: Pillar): boolean {
  const medWithADR = patient.medications.find(
    (med) => med.pillar === pillar && med.hasADR === true,
  )
  if (medWithADR) {
    return true
  }
  if (patient.history?.adrHistory?.[pillar] !== undefined) {
    return true
  }
  return false
}

function checkAllergy(patient: PatientSnapshot, pillar: Pillar): boolean {
  const medWithAllergy = patient.medications.find(
    (med) => med.pillar === pillar && med.hasAllergy === true,
  )
  if (medWithAllergy) {
    return true
  }
  if (patient.history?.allergies?.includes(pillar)) {
    return true
  }
  return false
}

function checkPatientRefusal(patient: PatientSnapshot, pillar: Pillar): boolean {
  return patient.medications.some(
    (med) => med.pillar === pillar && med.patientRefusal === true,
  )
}

function checkCostBarrier(patient: PatientSnapshot, pillar: Pillar): boolean {
  return patient.medications.some(
    (med) => med.pillar === pillar && med.costBarrier === true,
  )
}

type AccessBarrierType = 'pa_pending' | 'pa_denied' | 'step_therapy' | 'copay_prohibitive' | 'formulary_excluded'

function checkAccessBarrier(patient: PatientSnapshot, pillar: Pillar): ReadonlyArray<BlockerCode> {
  const med = patient.medications.find((m) => m.pillar === pillar)
  if (!med?.accessBarrier) return []

  const mapping: Readonly<Record<AccessBarrierType, BlockerCode>> = {
    pa_pending: 'PA_PENDING',
    pa_denied: 'PA_DENIED',
    step_therapy: 'STEP_THERAPY_REQUIRED',
    copay_prohibitive: 'COPAY_PROHIBITIVE',
    formulary_excluded: 'FORMULARY_EXCLUDED',
  }

  return [mapping[med.accessBarrier.type]]
}

// ---------------------------------------------------------------------------
// DM-specific blocker detection per pillar
// ---------------------------------------------------------------------------

function detectMetforminBlockers(
  patient: PatientSnapshot,
  referenceDate: Date,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // eGFR < 30 -> lactic acidosis risk
  if (patient.egfr !== undefined && patient.egfr < 30) {
    blockers.push('LACTIC_ACIDOSIS_RISK')
  }

  // GI intolerance from ADR history
  if (checkADRHistory(patient, PILLARS.METFORMIN)) {
    blockers.push('GI_INTOLERANCE')
  }

  // Common blockers
  if (checkAllergy(patient, PILLARS.METFORMIN)) {
    blockers.push('ALLERGY')
  }
  if (checkPatientRefusal(patient, PILLARS.METFORMIN)) {
    blockers.push('PATIENT_REFUSAL')
  }
  if (checkCostBarrier(patient, PILLARS.METFORMIN)) {
    blockers.push('COST_BARRIER')
  }

  const accessBlockers = checkAccessBarrier(patient, PILLARS.METFORMIN)
  for (const ab of accessBlockers) {
    blockers.push(ab)
  }

  // Stale data
  const staleBlockers = detectStaleData(patient, referenceDate)
  for (const sb of staleBlockers) {
    blockers.push(sb)
  }

  // Unknown labs - eGFR needed for metformin safety
  if (patient.egfr === undefined) {
    blockers.push('UNKNOWN_LABS')
  }

  return blockers
}

function detectSGLT2iDMBlockers(
  patient: PatientSnapshot,
  referenceDate: Date,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // eGFR < 20 -> contraindicated
  if (patient.egfr !== undefined && patient.egfr < 20) {
    blockers.push('EGFR_LOW_INIT')
  }

  // ADR history
  if (checkADRHistory(patient, PILLARS.SGLT2i_DM)) {
    blockers.push('ADR_HISTORY')
  }

  // Common blockers
  if (checkAllergy(patient, PILLARS.SGLT2i_DM)) {
    blockers.push('ALLERGY')
  }
  if (checkPatientRefusal(patient, PILLARS.SGLT2i_DM)) {
    blockers.push('PATIENT_REFUSAL')
  }
  if (checkCostBarrier(patient, PILLARS.SGLT2i_DM)) {
    blockers.push('COST_BARRIER')
  }

  const accessBlockers = checkAccessBarrier(patient, PILLARS.SGLT2i_DM)
  for (const ab of accessBlockers) {
    blockers.push(ab)
  }

  // Stale data
  const staleBlockers = detectStaleData(patient, referenceDate)
  for (const sb of staleBlockers) {
    blockers.push(sb)
  }

  // Unknown labs
  if (patient.egfr === undefined) {
    blockers.push('UNKNOWN_LABS')
  }

  return blockers
}

function detectGLP1RABlockers(
  patient: PatientSnapshot,
  referenceDate: Date,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // Pancreatitis history
  if (patient.history?.adrHistory?.['GLP1_RA'] === 'pancreatitis' ||
      patient.medications.some(
        (med) => med.pillar === PILLARS.GLP1_RA && med.adrDescription?.toLowerCase().includes('pancreatitis'),
      )) {
    blockers.push('PANCREATITIS_HISTORY')
  }

  // ADR history (non-pancreatitis)
  if (checkADRHistory(patient, PILLARS.GLP1_RA)) {
    blockers.push('ADR_HISTORY')
  }

  // Common blockers
  if (checkAllergy(patient, PILLARS.GLP1_RA)) {
    blockers.push('ALLERGY')
  }
  if (checkPatientRefusal(patient, PILLARS.GLP1_RA)) {
    blockers.push('PATIENT_REFUSAL')
  }
  if (checkCostBarrier(patient, PILLARS.GLP1_RA)) {
    blockers.push('COST_BARRIER')
  }

  const accessBlockers = checkAccessBarrier(patient, PILLARS.GLP1_RA)
  for (const ab of accessBlockers) {
    blockers.push(ab)
  }

  // Stale data
  const staleBlockers = detectStaleData(patient, referenceDate)
  for (const sb of staleBlockers) {
    blockers.push(sb)
  }

  return blockers
}

function detectInsulinBlockers(
  patient: PatientSnapshot,
  referenceDate: Date,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // Hypoglycemia risk
  if (patient.medications.some(
    (med) => med.pillar === PILLARS.INSULIN && med.hasADR === true,
  )) {
    blockers.push('HYPOGLYCEMIA_RISK')
  }

  // Common blockers
  if (checkAllergy(patient, PILLARS.INSULIN)) {
    blockers.push('ALLERGY')
  }
  if (checkPatientRefusal(patient, PILLARS.INSULIN)) {
    blockers.push('PATIENT_REFUSAL')
  }
  if (checkCostBarrier(patient, PILLARS.INSULIN)) {
    blockers.push('COST_BARRIER')
  }

  const accessBlockers = checkAccessBarrier(patient, PILLARS.INSULIN)
  for (const ab of accessBlockers) {
    blockers.push(ab)
  }

  // Stale data
  const staleBlockers = detectStaleData(patient, referenceDate)
  for (const sb of staleBlockers) {
    blockers.push(sb)
  }

  return blockers
}

// ---------------------------------------------------------------------------
// Pillar-specific blocker dispatch
// ---------------------------------------------------------------------------

function detectDMBlockers(
  patient: PatientSnapshot,
  pillar: Pillar,
  referenceDate: Date,
): ReadonlyArray<BlockerCode> {
  switch (pillar) {
    case PILLARS.METFORMIN:
      return detectMetforminBlockers(patient, referenceDate)
    case PILLARS.SGLT2i_DM:
      return detectSGLT2iDMBlockers(patient, referenceDate)
    case PILLARS.GLP1_RA:
      return detectGLP1RABlockers(patient, referenceDate)
    case PILLARS.INSULIN:
      return detectInsulinBlockers(patient, referenceDate)
    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// Pillar status determination
// ---------------------------------------------------------------------------

function determinePillarStatus(
  medication: Medication | undefined,
  blockers: ReadonlyArray<BlockerCode>,
): 'ON_TARGET' | 'UNDERDOSED' | 'MISSING' | 'CONTRAINDICATED' | 'UNKNOWN' {
  if (medication !== undefined) {
    if (medication.doseTier === 'HIGH') {
      return 'ON_TARGET'
    }
    return 'UNDERDOSED'
  }

  if (blockers.includes('ALLERGY')) {
    return 'CONTRAINDICATED'
  }

  // LACTIC_ACIDOSIS_RISK for metformin = contraindicated (eGFR < 30)
  if (blockers.includes('LACTIC_ACIDOSIS_RISK')) {
    return 'CONTRAINDICATED'
  }

  // PANCREATITIS_HISTORY for GLP-1 RA = contraindicated
  if (blockers.includes('PANCREATITIS_HISTORY')) {
    return 'CONTRAINDICATED'
  }

  if (blockers.includes('UNKNOWN_LABS')) {
    const hasOnlyDataBlockers = blockers.every(
      (b) =>
        b === 'UNKNOWN_LABS' ||
        b === 'STALE_LABS' ||
        b === 'STALE_VITALS',
    )
    if (hasOnlyDataBlockers) {
      return 'UNKNOWN'
    }
  }

  return 'MISSING'
}

// ---------------------------------------------------------------------------
// Pillar applicability (not all pillars needed for every DM patient)
// ---------------------------------------------------------------------------

function isPillarApplicable(
  pillar: Pillar,
  patient: PatientSnapshot,
  category: DMCategory,
): boolean {
  // HbA1c at goal -> only METFORMIN maintenance pillar is evaluated
  if (category === 'DM_CONTROLLED') {
    return pillar === PILLARS.METFORMIN
  }

  switch (pillar) {
    case PILLARS.METFORMIN:
      // First-line for all T2DM
      return true
    case PILLARS.SGLT2i_DM:
      // Second-line for CKD (eGFR 20-45) or CVD risk
      return patient.ckd === true || patient.cvdRisk === true ||
        (patient.egfr !== undefined && patient.egfr >= 20 && patient.egfr <= 45)
    case PILLARS.GLP1_RA:
      // Second-line for CVD risk or BMI >= 30
      return patient.cvdRisk === true || (patient.bmi !== undefined && patient.bmi >= 30)
    case PILLARS.INSULIN:
      // If HbA1c >= 10% or not controlled on oral agents
      return (patient.hba1c !== undefined && patient.hba1c >= 10)
    default:
      return false
  }
}

// ---------------------------------------------------------------------------
// Evaluate a single DM pillar
// ---------------------------------------------------------------------------

function evaluateDMPillar(
  patient: PatientSnapshot,
  pillar: Pillar,
  _category: DMCategory,
  referenceDate: Date,
): PillarResult {
  const medication = findMedication(patient.medications, pillar)
  const doseTier: DoseTier = medication?.doseTier ?? 'NOT_PRESCRIBED'

  const blockers = detectDMBlockers(patient, pillar, referenceDate)

  // ON_TARGET medications have no blockers
  const finalBlockers: ReadonlyArray<BlockerCode> =
    (medication !== undefined && medication.doseTier === 'HIGH')
      ? []
      : blockers.length === 0
        ? ['CLINICAL_INERTIA']
        : blockers

  const status = determinePillarStatus(medication, finalBlockers)
  const missingInfo = buildMissingInfo(patient, finalBlockers, pillar)

  return {
    pillar,
    status,
    doseTier,
    blockers: finalBlockers,
    missingInfo,
  }
}

// ---------------------------------------------------------------------------
// Missing info
// ---------------------------------------------------------------------------

function buildMissingInfo(
  patient: PatientSnapshot,
  blockers: ReadonlyArray<BlockerCode>,
  _pillar: Pillar,
): ReadonlyArray<string> {
  const info: string[] = []

  if (blockers.includes('UNKNOWN_LABS')) {
    if (patient.egfr === undefined) {
      info.push('Obtain eGFR')
    }
    if (patient.hba1c === undefined) {
      info.push('Obtain HbA1c')
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

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

function calculateDMScore(
  pillarResults: ReadonlyArray<PillarResult>,
): GDMTScore {
  const excludedPillars: Pillar[] = []
  let isIncomplete = false
  let score = 0
  let maxPossible = 0

  for (const result of pillarResults) {
    if (result.status === 'CONTRAINDICATED') {
      excludedPillars.push(result.pillar)
      continue
    }

    if (result.status === 'UNKNOWN') {
      isIncomplete = true
    }

    score += getDoseTierPoints(result.doseTier)
    maxPossible += MAX_POINTS_PER_PILLAR
  }

  const normalized = maxPossible > 0
    ? Math.round((score / maxPossible) * 100)
    : 0

  return {
    score,
    maxPossible,
    normalized,
    excludedPillars,
    isIncomplete,
  }
}

// ---------------------------------------------------------------------------
// Next best questions
// ---------------------------------------------------------------------------

function generateNextBestQuestions(
  pillarResults: ReadonlyArray<PillarResult>,
): ReadonlyArray<string> {
  const questions: string[] = []
  const seen = new Set<string>()

  function addUnique(q: string): void {
    if (!seen.has(q)) {
      seen.add(q)
      questions.push(q)
    }
  }

  for (const pr of pillarResults) {
    for (const blocker of pr.blockers) {
      const pillarName = DM_PILLAR_DISPLAY_NAMES[pr.pillar] ?? pr.pillar

      if (blocker === 'STALE_LABS') {
        addUnique('Order updated lab panel (HbA1c, eGFR, fasting glucose)')
      }

      if (blocker === 'UNKNOWN_LABS') {
        addUnique('Obtain HbA1c')
        addUnique('Obtain renal function (eGFR)')
      }

      if (blocker === 'CLINICAL_INERTIA') {
        addUnique(
          `Review ${pillarName} \u2014 no identified barrier to optimization`,
        )
      }

      if (blocker === 'ADR_HISTORY' || blocker === 'GI_INTOLERANCE') {
        addUnique(
          'Review previous adverse reaction and consider alternative formulation or agent',
        )
      }

      if (blocker === 'LACTIC_ACIDOSIS_RISK') {
        addUnique('Reassess renal function \u2014 metformin contraindicated if eGFR < 30')
      }

      if (blocker === 'PANCREATITIS_HISTORY') {
        addUnique('Pancreatitis history documented \u2014 GLP-1 RA contraindicated')
      }

      if (blocker === 'HYPOGLYCEMIA_RISK') {
        addUnique('Review insulin regimen for hypoglycemia risk reduction')
      }
    }
  }

  return questions
}

// ---------------------------------------------------------------------------
// Deduplicate missing info across pillars
// ---------------------------------------------------------------------------

function deduplicateMissingInfo(
  pillarResults: ReadonlyArray<PillarResult>,
): ReadonlyArray<string> {
  const seen = new Set<string>()
  const result: string[] = []

  for (const pr of pillarResults) {
    for (const info of pr.missingInfo) {
      if (!seen.has(info)) {
        seen.add(info)
        result.push(info)
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Main audit function
// ---------------------------------------------------------------------------

export function runDMAudit(
  patient: PatientSnapshot,
  referenceDate?: Date,
): AuditResult {
  const ref = referenceDate ?? new Date()
  const category = classifyDMCategory(patient)

  const applicablePillars = DM_PILLARS.filter(
    (pillar) => isPillarApplicable(pillar, patient, category),
  )

  const pillarResults: ReadonlyArray<PillarResult> = applicablePillars.map(
    (pillar) => evaluateDMPillar(patient, pillar, category, ref),
  )

  const gdmtScore = calculateDMScore(pillarResults)
  const missingInfo = deduplicateMissingInfo(pillarResults)
  const nextBestQuestions = generateNextBestQuestions(pillarResults)

  return {
    domainId: 'dm-mgmt',
    efCategory: 'HFrEF',
    categoryLabel: DM_CATEGORY_LABELS[category],
    pillarResults,
    gdmtScore,
    missingInfo,
    nextBestQuestions,
    timestamp: new Date().toISOString(),
  }
}
