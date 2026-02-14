import type { PatientSnapshot, AuditResult, PillarResult, GDMTScore, Pillar } from '../types/index.ts'
import { PILLARS } from '../types/index.ts'
import { classifyEF } from './classify-ef.ts'
import { evaluatePillar } from './evaluate-pillar.ts'
import { calculateGDMTScore } from './calculate-score.ts'
import { calculateHFpEFScore } from './hfpef-score.ts'

const ALL_PILLARS: ReadonlyArray<Pillar> = [
  PILLARS.ARNI_ACEi_ARB,
  PILLARS.BETA_BLOCKER,
  PILLARS.MRA,
  PILLARS.SGLT2i,
]

const PILLAR_DISPLAY_NAMES: Readonly<Record<Pillar, string>> = {
  ARNI_ACEi_ARB: 'ARNI/ACEi/ARB',
  BETA_BLOCKER: 'Beta-blocker',
  MRA: 'MRA',
  SGLT2i: 'SGLT2i',
}

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
      const pillarName = PILLAR_DISPLAY_NAMES[pr.pillar]

      if (blocker === 'STALE_LABS') {
        addUnique('Order updated lab panel (eGFR, K+)')
      }

      if (blocker === 'UNKNOWN_LABS') {
        addUnique('Obtain renal function (eGFR)')
        addUnique('Check potassium level')
      }

      if (blocker === 'CLINICAL_INERTIA') {
        addUnique(
          `Review ${pillarName} — no identified barrier to optimization`,
        )
      }

      if (blocker === 'ADR_HISTORY') {
        addUnique(
          'Review previous adverse reaction and consider re-challenge or alternative',
        )
      }
    }
  }

  return questions
}

export function runAudit(
  patient: PatientSnapshot,
  referenceDate?: Date,
): AuditResult {
  const efCategory = classifyEF(patient.ef)

  const isHFpEF = efCategory === 'HFpEF'

  const applicablePillars: ReadonlyArray<Pillar> = isHFpEF
    ? [PILLARS.SGLT2i]
    : ALL_PILLARS

  const pillarResults: ReadonlyArray<PillarResult> = applicablePillars.map(
    (pillar) => evaluatePillar(patient, pillar, referenceDate),
  )

  let gdmtScore: GDMTScore

  if (isHFpEF) {
    const hfpefResult = calculateHFpEFScore(patient, pillarResults)
    gdmtScore = {
      score: hfpefResult.score,
      maxPossible: hfpefResult.maxPossible,
      normalized: hfpefResult.maxPossible > 0
        ? Math.round((hfpefResult.score / hfpefResult.maxPossible) * 100)
        : 0,
      excludedPillars: [],
      isIncomplete: false,
    }
  } else {
    gdmtScore = calculateGDMTScore(pillarResults)
  }

  const missingInfo = deduplicateMissingInfo(pillarResults)
  const nextBestQuestions = generateNextBestQuestions(pillarResults)

  return {
    efCategory,
    pillarResults,
    gdmtScore,
    missingInfo,
    nextBestQuestions,
    timestamp: new Date().toISOString(),
  }
}
