import type { AuditResult, PillarResult } from '../types/audit.ts'
import type { PatientSnapshot } from '../types/patient.ts'
import type { Nudge, NudgePriority } from '../types/patient-view.ts'
import type { BlockerCode } from '../types/blocker.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'

const STALE_LAB_BLOCKERS: ReadonlyArray<BlockerCode> = ['STALE_LABS', 'UNKNOWN_LABS']

const PRIORITY_ORDER: Readonly<Record<NudgePriority, number>> = {
  high: 0,
  medium: 1,
  low: 2,
}

function hasStaleLabBlocker(blockers: ReadonlyArray<BlockerCode>): boolean {
  return blockers.some((b) => STALE_LAB_BLOCKERS.includes(b))
}

function buildMedicationNudge(pillarResult: PillarResult): Nudge {
  const pillarLabel = PILLAR_LABELS[pillarResult.pillar]
  const isMissing = pillarResult.status === 'MISSING'

  return {
    id: `nudge-${pillarResult.pillar}-medication_reminder`,
    type: 'medication_reminder',
    priority: 'high',
    title: isMissing
      ? `Discuss ${pillarLabel} with your doctor`
      : `${pillarLabel} dose adjustment opportunity`,
    message: isMissing
      ? `${pillarLabel} is a guideline-recommended treatment that has not been started yet. Ask your care team if it might be right for you.`
      : `Your current ${pillarLabel} dose may be below the target. Your care team can discuss whether a dose adjustment is appropriate.`,
    actionLabel: 'Learn more',
    pillar: pillarResult.pillar,
    status: 'pending',
  }
}

function buildLabDueNudge(pillarResult: PillarResult): Nudge {
  return {
    id: `nudge-${pillarResult.pillar}-lab_due`,
    type: 'lab_due',
    priority: 'medium',
    title: 'Lab work may be needed',
    message: 'Your recent lab results may be outdated. Updated labs help your care team make the best decisions about your treatment.',
    actionLabel: 'Schedule labs',
    pillar: pillarResult.pillar,
    status: 'pending',
  }
}

function buildMilestoneNudge(pillarResult: PillarResult): Nudge {
  const pillarLabel = PILLAR_LABELS[pillarResult.pillar]

  return {
    id: `nudge-${pillarResult.pillar}-milestone_celebration`,
    type: 'milestone_celebration',
    priority: 'low',
    title: `${pillarLabel} is on target`,
    message: `Great news! Your ${pillarLabel} treatment is at the recommended level. Keep taking your medication as prescribed.`,
    pillar: pillarResult.pillar,
    status: 'pending',
  }
}

function buildLifestyleTipNudge(): Nudge {
  return {
    id: 'nudge-general-lifestyle_tip',
    type: 'lifestyle_tip',
    priority: 'low',
    title: 'Daily health tip',
    message: 'Regular physical activity, even a short daily walk, can support your heart health. Talk to your care team about an activity plan that works for you.',
    status: 'pending',
  }
}

function buildDmLifestyleNudges(): ReadonlyArray<Nudge> {
  return [
    {
      id: 'nudge-dm-lifestyle_tip-glucose',
      type: 'lifestyle_tip',
      priority: 'medium',
      title: 'Monitor your blood sugar',
      message: 'Regular blood sugar monitoring helps you and your care team track how well your diabetes management is working. Try to check at the times your doctor recommends.',
      status: 'pending',
    },
    {
      id: 'nudge-dm-lifestyle_tip-exercise',
      type: 'lifestyle_tip',
      priority: 'low',
      title: 'Stay active',
      message: 'Aim for at least 150 minutes of moderate activity per week. Even short walks after meals can help manage blood sugar levels.',
      status: 'pending',
    },
    {
      id: 'nudge-dm-lifestyle_tip-diet',
      type: 'lifestyle_tip',
      priority: 'low',
      title: 'Healthy eating matters',
      message: 'A balanced diet rich in vegetables, whole grains, and lean proteins can help manage your blood sugar. Consider working with a dietitian for a personalized plan.',
      status: 'pending',
    },
  ]
}

function buildHtnLifestyleNudges(): ReadonlyArray<Nudge> {
  return [
    {
      id: 'nudge-htn-lifestyle_tip-bp',
      type: 'lifestyle_tip',
      priority: 'medium',
      title: 'Monitor your blood pressure',
      message: 'Home blood pressure monitoring helps track your progress. Try to measure at the same time each day, sitting quietly for 5 minutes before each reading.',
      status: 'pending',
    },
    {
      id: 'nudge-htn-lifestyle_tip-salt',
      type: 'lifestyle_tip',
      priority: 'low',
      title: 'Reduce salt intake',
      message: 'Reducing sodium to less than 2,300 mg per day can help lower blood pressure. Read food labels and choose fresh foods over processed options when possible.',
      status: 'pending',
    },
  ]
}

function buildNudgesFromPillarResults(
  pillarResults: ReadonlyArray<PillarResult>,
): ReadonlyArray<Nudge> {
  const nudges: Array<Nudge> = []
  const seenLabNudge = new Set<string>()

  for (const pillarResult of pillarResults) {
    if (pillarResult.status === 'MISSING' || pillarResult.status === 'UNDERDOSED') {
      nudges.push(buildMedicationNudge(pillarResult))
    }

    if (hasStaleLabBlocker(pillarResult.blockers) && !seenLabNudge.has('lab_due')) {
      nudges.push(buildLabDueNudge(pillarResult))
      seenLabNudge.add('lab_due')
    }

    if (pillarResult.status === 'ON_TARGET') {
      nudges.push(buildMilestoneNudge(pillarResult))
    }
  }

  return nudges
}

function buildDomainNudges(
  patient: PatientSnapshot,
): ReadonlyArray<Nudge> {
  if (patient.domainId === 'dm-mgmt') {
    return buildDmLifestyleNudges()
  }
  if (patient.domainId === 'htn-control') {
    return buildHtnLifestyleNudges()
  }
  return []
}

export function generateNudges(
  auditResult: AuditResult,
  patient: PatientSnapshot,
): ReadonlyArray<Nudge> {
  const pillarNudges = buildNudgesFromPillarResults(auditResult.pillarResults)
  const domainNudges = buildDomainNudges(patient)
  const lifestyleTip = buildLifestyleTipNudge()

  const allNudges = [...pillarNudges, ...domainNudges, lifestyleTip]

  return [...allNudges].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )
}
