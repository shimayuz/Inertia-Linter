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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HTN_PILLARS: ReadonlyArray<Pillar> = [
  PILLARS.ACEi_ARB_HTN,
  PILLARS.CCB,
  PILLARS.THIAZIDE,
  PILLARS.BETA_BLOCKER_HTN,
] as const

const MAX_POINTS_PER_PILLAR = 25

const DEFAULT_TARGET_SBP = 130
const DEFAULT_TARGET_DBP = 80
// Reserved for elderly-specific HTN targets (future implementation)
// const ELDERLY_TARGET_SBP = 140
// const ELDERLY_TARGET_DBP = 90
// const ELDERLY_AGE_THRESHOLD = 80

const STAGE2_SBP = 160
const STAGE2_DBP = 100
const STAGE1_SBP = 140
const STAGE1_DBP = 90

const K_HIGH_THRESHOLD = 5.0
const EGFR_THIAZIDE_THRESHOLD = 30

const PILLAR_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  ACEi_ARB_HTN: 'ACEi/ARB',
  CCB: 'CCB',
  THIAZIDE: 'Thiazide',
  BETA_BLOCKER_HTN: 'Beta-blocker',
}

// ---------------------------------------------------------------------------
// HTN Category Classification
// ---------------------------------------------------------------------------

type HTNCategory = 'HTN_STAGE2' | 'HTN_STAGE1' | 'HTN_RESISTANT' | 'HTN_CONTROLLED'

function classifyHTNCategory(
  patient: PatientSnapshot,
  targetSBP: number,
  targetDBP: number,
): HTNCategory {
  const sbp = patient.sbp
  const dbp = patient.dbp ?? 0

  const agentCount = countActiveAgents(patient.medications)
  const aboveTarget = sbp > targetSBP || dbp > targetDBP

  if (agentCount >= 3 && aboveTarget) {
    return 'HTN_RESISTANT'
  }

  if (sbp >= STAGE2_SBP || dbp >= STAGE2_DBP) {
    return 'HTN_STAGE2'
  }

  if (sbp >= STAGE1_SBP || dbp >= STAGE1_DBP) {
    return 'HTN_STAGE1'
  }

  return 'HTN_CONTROLLED'
}

function categoryToLabel(category: HTNCategory): string {
  const labels: Readonly<Record<HTNCategory, string>> = {
    HTN_STAGE2: 'Stage 2 HTN',
    HTN_STAGE1: 'Stage 1 HTN',
    HTN_RESISTANT: 'Resistant HTN',
    HTN_CONTROLLED: 'Controlled HTN',
  }
  return labels[category]
}

// ---------------------------------------------------------------------------
// BP Target Resolution
// ---------------------------------------------------------------------------

function resolveBPTargets(
  patient: PatientSnapshot,
): { readonly targetSBP: number; readonly targetDBP: number } {
  if (patient.targetSBP !== undefined && patient.targetDBP !== undefined) {
    return { targetSBP: patient.targetSBP, targetDBP: patient.targetDBP }
  }

  // Elderly patients (age >= 80) get relaxed targets
  // Since we don't have a direct age field, use htnStage as proxy
  // or default to standard targets
  return {
    targetSBP: patient.targetSBP ?? DEFAULT_TARGET_SBP,
    targetDBP: patient.targetDBP ?? DEFAULT_TARGET_DBP,
  }
}

// ---------------------------------------------------------------------------
// Medication Helpers
// ---------------------------------------------------------------------------

function findMedication(
  medications: ReadonlyArray<Medication>,
  pillar: Pillar,
): Medication | undefined {
  return medications.find(
    (med) => med.pillar === pillar && med.doseTier !== 'NOT_PRESCRIBED',
  )
}

function countActiveAgents(
  medications: ReadonlyArray<Medication>,
): number {
  return medications.filter((med) => med.doseTier !== 'NOT_PRESCRIBED').length
}

function hasCompellingIndicationForBB(patient: PatientSnapshot): boolean {
  // Beta-blocker has compelling indication if:
  // - Heart rate is elevated (tachycardia > 100)
  // - EF <= 40 (HFrEF coexistence)
  // - Patient is already on a BB (assumed post-MI or other indication)
  const hasTachycardia = patient.hr > 100
  const hasHFrEF = patient.ef <= 40
  const alreadyOnBB = patient.medications.some(
    (med) => med.pillar === PILLARS.BETA_BLOCKER_HTN && med.doseTier !== 'NOT_PRESCRIBED',
  )
  return hasTachycardia || hasHFrEF || alreadyOnBB
}

// ---------------------------------------------------------------------------
// Per-Pillar Blocker Detection
// ---------------------------------------------------------------------------

function detectACEiARBBlockers(
  patient: PatientSnapshot,
  pillar: Pillar,
  _referenceDate: Date,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // Angioedema history is absolute contraindication for ACEi
  if (checkMedFlag(patient, pillar, 'angioedema') ||
      patient.history?.adrHistory?.[pillar] === 'angioedema') {
    blockers.push('ANGIOEDEMA_HISTORY')
  }

  // Pregnancy risk
  if (checkMedFlag(patient, pillar, 'pregnancy')) {
    blockers.push('PREGNANCY_RISK')
  }

  // Potassium check
  if (patient.potassium !== undefined && patient.potassium > K_HIGH_THRESHOLD) {
    blockers.push('K_HIGH')
  }

  return blockers
}

function detectCCBBlockers(
  patient: PatientSnapshot,
  pillar: Pillar,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // Ankle edema is a relative blocker for CCB (esp. dihydropyridines)
  if (checkMedFlag(patient, pillar, 'ankleEdema')) {
    blockers.push('ANKLE_EDEMA')
  }

  return blockers
}

function detectThiazideBlockers(
  patient: PatientSnapshot,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // Gout / hyperuricemia risk
  if (patient.history?.adrHistory?.[PILLARS.THIAZIDE] === 'gout') {
    blockers.push('GOUT_RISK')
  }

  // eGFR < 30 reduces thiazide efficacy (except indapamide/metolazone)
  if (patient.egfr !== undefined && patient.egfr < EGFR_THIAZIDE_THRESHOLD) {
    blockers.push('EGFR_LOW_INIT')
  }

  return blockers
}

function detectBBHTNBlockers(
  patient: PatientSnapshot,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // HR check for BB - too low
  if (patient.hr < 60) {
    blockers.push('HR_LOW')
  }

  return blockers
}

// ---------------------------------------------------------------------------
// Common Blocker Detection
// ---------------------------------------------------------------------------

function checkMedFlag(
  patient: PatientSnapshot,
  pillar: Pillar,
  flag: 'angioedema' | 'pregnancy' | 'ankleEdema',
): boolean {
  const med = patient.medications.find((m) => m.pillar === pillar)
  if (!med) return false

  if (flag === 'angioedema') return med.hasADR === true
  if (flag === 'pregnancy') return med.hasAllergy === true // repurpose allergy flag for pregnancy
  if (flag === 'ankleEdema') return med.hasADR === true
  return false
}

function detectCommonBlockers(
  patient: PatientSnapshot,
  pillar: Pillar,
): ReadonlyArray<BlockerCode> {
  const blockers: BlockerCode[] = []

  // ADR history
  if (patient.history?.adrHistory?.[pillar] !== undefined &&
      patient.history.adrHistory[pillar] !== 'angioedema' &&
      patient.history.adrHistory[pillar] !== 'gout') {
    blockers.push('ADR_HISTORY')
  }

  const med = patient.medications.find((m) => m.pillar === pillar)
  if (med?.hasADR === true && pillar !== PILLARS.ACEi_ARB_HTN && pillar !== PILLARS.CCB) {
    blockers.push('ADR_HISTORY')
  }

  // Allergy
  if (patient.history?.allergies?.includes(pillar)) {
    blockers.push('ALLERGY')
  }
  if (med?.hasAllergy === true && pillar !== PILLARS.ACEi_ARB_HTN) {
    blockers.push('ALLERGY')
  }

  // Patient refusal
  if (med?.patientRefusal === true) {
    blockers.push('PATIENT_REFUSAL')
  }

  // Cost barrier
  if (med?.costBarrier === true) {
    blockers.push('COST_BARRIER')
  }

  // Access barriers
  if (med?.accessBarrier) {
    const accessMapping: Readonly<Record<string, BlockerCode>> = {
      pa_pending: 'PA_PENDING',
      pa_denied: 'PA_DENIED',
      step_therapy: 'STEP_THERAPY_REQUIRED',
      copay_prohibitive: 'COPAY_PROHIBITIVE',
      formulary_excluded: 'FORMULARY_EXCLUDED',
    }
    const mapped = accessMapping[med.accessBarrier.type]
    if (mapped !== undefined) {
      blockers.push(mapped)
    }
  }

  return blockers
}

// ---------------------------------------------------------------------------
// Pillar Evaluation
// ---------------------------------------------------------------------------

function determinePillarStatus(
  medication: Medication | undefined,
  blockers: ReadonlyArray<BlockerCode>,
): import('../../types/index.ts').PillarStatus {
  if (medication !== undefined) {
    if (medication.doseTier === 'HIGH') {
      return 'ON_TARGET'
    }
    return 'UNDERDOSED'
  }

  if (blockers.includes('ALLERGY') || blockers.includes('ANGIOEDEMA_HISTORY')) {
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

  if (blockers.includes('BP_AT_GOAL')) {
    return 'ON_TARGET'
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

function evaluateHTNPillar(
  patient: PatientSnapshot,
  pillar: Pillar,
  bpAtGoal: boolean,
  referenceDate: Date,
): PillarResult {
  const medication = findMedication(patient.medications, pillar)
  const doseTier: DoseTier = medication?.doseTier ?? 'NOT_PRESCRIBED'

  // Stale data blockers
  const staleBlockers = detectStaleData(patient, referenceDate)

  // Pillar-specific blockers
  let pillarBlockers: ReadonlyArray<BlockerCode>
  if (pillar === PILLARS.ACEi_ARB_HTN) {
    pillarBlockers = detectACEiARBBlockers(patient, pillar, referenceDate)
  } else if (pillar === PILLARS.CCB) {
    pillarBlockers = detectCCBBlockers(patient, pillar)
  } else if (pillar === PILLARS.THIAZIDE) {
    pillarBlockers = detectThiazideBlockers(patient)
  } else {
    pillarBlockers = detectBBHTNBlockers(patient)
  }

  // Common blockers (ADR, allergy, cost, access, refusal)
  const commonBlockers = detectCommonBlockers(patient, pillar)

  // Merge all blockers
  const allBlockersSet = new Set<BlockerCode>([
    ...pillarBlockers,
    ...commonBlockers,
    ...staleBlockers,
  ])

  // Unknown labs check
  if (patient.egfr === undefined || patient.potassium === undefined) {
    if (patient.labsDate === undefined) {
      allBlockersSet.add('UNKNOWN_LABS')
    }
  }

  // BP at goal means no need to intensify
  if (bpAtGoal && medication === undefined) {
    allBlockersSet.clear()
    allBlockersSet.add('BP_AT_GOAL')
  }

  // ON_TARGET medications have no blockers
  if (medication !== undefined && medication.doseTier === 'HIGH') {
    allBlockersSet.clear()
  }

  // BB_HTN special case: if no compelling indication AND not prescribed,
  // it is not clinical inertia — BB is not first-line for HTN
  if (pillar === PILLARS.BETA_BLOCKER_HTN &&
      medication === undefined &&
      !hasCompellingIndicationForBB(patient) &&
      !bpAtGoal) {
    // No blockers needed — BB is simply not indicated for standard HTN
    // Return MISSING with no blockers (not clinical inertia)
    const missingInfo = buildMissingInfo(patient, [...allBlockersSet])
    return {
      pillar,
      status: 'MISSING',
      doseTier,
      blockers: [],
      missingInfo,
    }
  }

  // If no blockers found for a missing medication, that's clinical inertia
  if (allBlockersSet.size === 0 && medication === undefined) {
    allBlockersSet.add('CLINICAL_INERTIA')
  }

  const allBlockers: ReadonlyArray<BlockerCode> = [...allBlockersSet]

  const status = determinePillarStatus(medication, allBlockers)
  const missingInfo = buildMissingInfo(patient, allBlockers)

  return {
    pillar,
    status,
    doseTier,
    blockers: allBlockers,
    missingInfo,
  }
}

// ---------------------------------------------------------------------------
// Score Calculation
// ---------------------------------------------------------------------------

function calculateHTNScore(
  pillarResults: ReadonlyArray<PillarResult>,
  hasCompellingBBIndication: boolean,
): GDMTScore {
  const excludedPillars: Pillar[] = []
  let isIncomplete = false
  let score = 0
  let maxPossible = 0

  for (const result of pillarResults) {
    // BB_HTN only contributes to score if there's a compelling indication
    if (result.pillar === PILLARS.BETA_BLOCKER_HTN && !hasCompellingBBIndication) {
      excludedPillars.push(result.pillar)
      continue
    }

    if (result.status === 'CONTRAINDICATED') {
      excludedPillars.push(result.pillar)
      continue
    }

    if (result.status === 'UNKNOWN') {
      isIncomplete = true
    }

    const tierPoints: Readonly<Record<DoseTier, number>> = {
      NOT_PRESCRIBED: 0,
      LOW: 8,
      MEDIUM: 16,
      HIGH: 25,
    }

    score += tierPoints[result.doseTier]
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
// Missing Info & Next Best Questions (deduplicated)
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
      const pillarName = PILLAR_DISPLAY_NAMES[pr.pillar] ?? pr.pillar

      if (blocker === 'STALE_LABS') {
        addUnique('Order updated lab panel (eGFR, K+, uric acid)')
      }

      if (blocker === 'UNKNOWN_LABS') {
        addUnique('Obtain renal function (eGFR)')
        addUnique('Check potassium level')
      }

      if (blocker === 'CLINICAL_INERTIA') {
        addUnique(
          `Review ${pillarName} \u2014 no identified barrier to optimization`,
        )
      }

      if (blocker === 'ADR_HISTORY') {
        addUnique(
          'Review previous adverse reaction and consider re-challenge or alternative',
        )
      }

      if (blocker === 'ANGIOEDEMA_HISTORY') {
        addUnique('Consider ARB as alternative (angioedema rare with ARBs)')
      }

      if (blocker === 'GOUT_RISK') {
        addUnique('Check uric acid level; consider chlorthalidone or indapamide if mild')
      }

      if (blocker === 'EGFR_LOW_INIT') {
        addUnique('Consider loop diuretic instead of thiazide if eGFR < 30')
      }
    }
  }

  return questions
}

// ---------------------------------------------------------------------------
// Main Audit Function
// ---------------------------------------------------------------------------

export function runHTNAudit(
  patient: PatientSnapshot,
  referenceDate?: Date,
): AuditResult {
  const ref = referenceDate ?? new Date()

  const { targetSBP, targetDBP } = resolveBPTargets(patient)

  const category = classifyHTNCategory(patient, targetSBP, targetDBP)
  const bpAtGoal = category === 'HTN_CONTROLLED'

  const compellingBB = hasCompellingIndicationForBB(patient)

  const pillarResults: ReadonlyArray<PillarResult> = HTN_PILLARS.map(
    (pillar) => evaluateHTNPillar(patient, pillar, bpAtGoal, ref),
  )

  const gdmtScore = calculateHTNScore(pillarResults, compellingBB)

  const missingInfo = deduplicateMissingInfo(pillarResults)
  const nextBestQuestions = generateNextBestQuestions(pillarResults)

  return {
    domainId: 'htn-control',
    efCategory: 'HFrEF',
    categoryLabel: categoryToLabel(category),
    pillarResults,
    gdmtScore,
    missingInfo,
    nextBestQuestions,
    timestamp: new Date().toISOString(),
  }
}
