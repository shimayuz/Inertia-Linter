import type { AuditResult } from '../types/audit.ts'
import type { PatientInsight } from '../types/patient-view.ts'

const DOMAIN_LABELS: Readonly<Record<string, string>> = {
  'dm-mgmt': 'Diabetes Management',
  'htn-control': 'Blood Pressure Control',
}

const EF_LABELS: Readonly<Record<string, string>> = {
  HFrEF: 'Heart Failure',
  HFmrEF: 'Heart Failure',
  HFpEF: 'Heart Failure',
}

function resolveScoreLabel(auditResult: AuditResult): string {
  if (auditResult.domainId === 'dm-mgmt') {
    return 'Diabetes Management Score'
  }
  if (auditResult.domainId === 'htn-control') {
    return 'Blood Pressure Control Score'
  }
  return 'Treatment Optimization Score'
}

function resolveDomainLabel(auditResult: AuditResult): string {
  if (auditResult.categoryLabel) {
    return auditResult.categoryLabel
  }
  if (auditResult.domainId && DOMAIN_LABELS[auditResult.domainId]) {
    return DOMAIN_LABELS[auditResult.domainId]
  }
  return EF_LABELS[auditResult.efCategory] ?? 'Heart Failure'
}

function countOnTrackPillars(auditResult: AuditResult): number {
  return auditResult.pillarResults.filter(
    (p) => p.status === 'ON_TARGET',
  ).length
}

function resolveTopAction(auditResult: AuditResult): string {
  if (auditResult.nextBestQuestions.length > 0) {
    return auditResult.nextBestQuestions[0]
  }

  const missingPillars = auditResult.pillarResults.filter(
    (p) => p.status === 'MISSING',
  )
  if (missingPillars.length > 0) {
    return 'Ask your care team about starting a new treatment'
  }

  const underdosedPillars = auditResult.pillarResults.filter(
    (p) => p.status === 'UNDERDOSED',
  )
  if (underdosedPillars.length > 0) {
    return 'Discuss dose adjustments at your next visit'
  }

  return 'Continue your current treatment plan and attend follow-up visits'
}

function resolveEncouragement(normalized: number): string {
  if (normalized < 30) {
    return "Let's work together with your care team to find the best treatment plan for you. Every step forward matters."
  }
  if (normalized <= 60) {
    return "Good progress! You're on your way to an optimized treatment plan. Keep up the great work with your care team."
  }
  return "Great job! Your treatment plan is well-optimized. Continue taking your medications as prescribed."
}

export function generatePatientInsight(auditResult: AuditResult): PatientInsight {
  const { gdmtScore } = auditResult
  const pillarsOnTrack = countOnTrackPillars(auditResult)
  const totalPillars = auditResult.pillarResults.length

  return {
    overallScore: gdmtScore.score,
    maxScore: gdmtScore.maxPossible,
    scoreLabel: resolveScoreLabel(auditResult),
    domainLabel: resolveDomainLabel(auditResult),
    pillarsOnTrack,
    totalPillars,
    topAction: resolveTopAction(auditResult),
    encouragement: resolveEncouragement(gdmtScore.normalized),
  }
}
