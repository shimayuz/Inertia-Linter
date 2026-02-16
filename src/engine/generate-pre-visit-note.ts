import type { AuditResult } from '../types/audit.ts'
import type { ActionItem, ActionDecisionRecord } from '../types/action-plan.ts'
import type { Medication } from '../types/patient.ts'
import type { Pillar } from '../types/pillar.ts'
import type { DoseTier } from '../types/dose-tier.ts'
import type {
  MedicationChangeType,
  MedicationPlan,
  PatientExplanation,
  PreVisitNote,
} from '../types/pre-visit-note.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'

// ---------------------------------------------------------------------------
// Monitoring items per pillar
// ---------------------------------------------------------------------------

const MONITORING_ITEMS: Readonly<Partial<Record<Pillar, ReadonlyArray<string>>>> = {
  ARNI_ACEi_ARB: ['Blood pressure', 'Renal function (eGFR, Cr)', 'Potassium'],
  BETA_BLOCKER: ['Heart rate', 'Blood pressure', 'Symptoms of fatigue/dizziness'],
  MRA: ['Potassium', 'Renal function (eGFR)', 'Signs of gynecomastia (if spironolactone)'],
  SGLT2i: ['Renal function', 'Signs of genital/urinary infection', 'Volume status'],
}

// ---------------------------------------------------------------------------
// Side effects per pillar
// ---------------------------------------------------------------------------

const SIDE_EFFECTS: Readonly<Partial<Record<Pillar, ReadonlyArray<string>>>> = {
  ARNI_ACEi_ARB: ['Dizziness when standing', 'Dry cough (ACEi)', 'Elevated potassium'],
  BETA_BLOCKER: ['Fatigue', 'Slow heart rate', 'Cold hands/feet'],
  MRA: ['Elevated potassium', 'Breast tenderness (spironolactone)', 'Dizziness'],
  SGLT2i: ['Genital yeast infection', 'Urinary tract infection', 'Increased urination'],
}

// ---------------------------------------------------------------------------
// Target dose escalation map
// ---------------------------------------------------------------------------

const NEXT_DOSE_TIER: Readonly<Record<DoseTier, DoseTier>> = {
  NOT_PRESCRIBED: 'LOW',
  LOW: 'MEDIUM',
  MEDIUM: 'HIGH',
  HIGH: 'HIGH',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDecisionMap(
  decisions: ReadonlyArray<ActionDecisionRecord>,
): Readonly<Record<string, ActionDecisionRecord>> {
  const map: Record<string, ActionDecisionRecord> = {}
  for (const decision of decisions) {
    map[decision.actionId] = decision
  }
  return map
}

function findMedicationForPillar(
  medications: ReadonlyArray<Medication>,
  pillar: Pillar,
): Medication | undefined {
  return medications.find((m) => m.pillar === pillar)
}

function deriveChangeType(
  action: ActionItem,
  currentDose: DoseTier,
): MedicationChangeType {
  if (action.category === 'initiate' || currentDose === 'NOT_PRESCRIBED') {
    return 'INITIATE'
  }
  return 'UPTITRATE'
}

function buildExplanation(
  changeType: MedicationChangeType,
  pillarLabel: string,
  drugName: string,
): string {
  if (changeType === 'INITIATE') {
    return `Starting ${pillarLabel} (${drugName}) to help your heart pump more effectively and improve symptoms.`
  }
  return `Increasing the dose of ${drugName} to reach the target dose that has been shown to provide the most benefit.`
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function generatePreVisitNote(
  auditResult: AuditResult,
  actions: ReadonlyArray<ActionItem>,
  decisions: ReadonlyArray<ActionDecisionRecord>,
  medications: ReadonlyArray<Medication>,
): PreVisitNote {
  const decisionMap = buildDecisionMap(decisions)
  const medicationPlans: Array<MedicationPlan> = []
  const patientExplanations: Array<PatientExplanation> = []
  const deferredItems: Array<{ readonly pillar: Pillar; readonly reason: string }> = []
  const allMonitoringItems: Array<string> = []

  for (const action of actions) {
    const decision = decisionMap[action.id]
    if (!decision) {
      continue
    }

    if (decision.decision === 'address_now') {
      const medication = findMedicationForPillar(medications, action.pillar)
      const currentDose: DoseTier = medication?.doseTier ?? 'NOT_PRESCRIBED'
      const drugName = medication?.name ?? PILLAR_LABELS[action.pillar]
      const changeType = deriveChangeType(action, currentDose)
      const targetDose = NEXT_DOSE_TIER[currentDose]
      const monitoringItems = MONITORING_ITEMS[action.pillar] ?? []
      const pillarLabel = PILLAR_LABELS[action.pillar]

      medicationPlans.push({
        pillar: action.pillar,
        drugName,
        changeType,
        currentDose,
        targetDose,
        rationale: action.rationale,
        monitoringItems,
      })

      patientExplanations.push({
        pillar: action.pillar,
        drugName,
        explanation: buildExplanation(changeType, pillarLabel, drugName),
        sideEffectsToWatch: SIDE_EFFECTS[action.pillar] ?? [],
        whenToCallDoctor:
          'Call if you experience severe dizziness, swelling, or difficulty breathing',
      })

      for (const item of monitoringItems) {
        allMonitoringItems.push(item)
      }
    }

    if (decision.decision === 'defer') {
      deferredItems.push({
        pillar: action.pillar,
        reason: decision.reason ?? 'No reason provided',
      })
    }
  }

  // Deduplicate monitoring items while preserving order
  const seen = new Set<string>()
  const uniqueMonitoring: Array<string> = []
  for (const item of allMonitoringItems) {
    if (!seen.has(item)) {
      seen.add(item)
      uniqueMonitoring.push(item)
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    gdmtScore: auditResult.gdmtScore.normalized,
    efCategory: auditResult.efCategory,
    medicationPlans,
    patientExplanations,
    deferredItems,
    nextVisitMonitoring: uniqueMonitoring,
  }
}
