import type { AuditResult, PillarResult } from '../types/audit'
import type { EFCategory } from '../types/ef-category'
import type { Pillar } from '../types/pillar'
import { PILLAR_LABELS } from '../types/pillar'
import { DOSE_TIER_LABELS } from '../types/dose-tier'
import { BlockerLabel } from './labels/BlockerLabel'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'
import { Pictograph } from './Pictograph'
import { GuidelineComparisonPanel } from './GuidelineComparison'
import { InertiaBuster } from './InertiaBuster'
import { sglt2iPictographData } from '../data/pictograph-sglt2i-hfref'
import { guidelineDifferences } from '../data/guideline-differences'

interface DetailPanelProps {
  readonly auditResult: AuditResult | null
  readonly selectedPillar: Pillar | null
}

const STATUS_DESCRIPTIONS: Readonly<Record<string, string>> = {
  ON_TARGET: 'At guideline-recommended target dose',
  UNDERDOSED: 'Prescribed but below target dose — optimization opportunity',
  MISSING: 'Not currently prescribed — initiation opportunity',
  CONTRAINDICATED: 'Contraindicated based on current clinical data',
  UNKNOWN: 'Insufficient data to determine status',
}

function findPillarResult(
  results: ReadonlyArray<PillarResult>,
  pillar: Pillar,
): PillarResult | undefined {
  return results.find((r) => r.pillar === pillar)
}

function filterQuestionsForPillar(
  questions: ReadonlyArray<string>,
  pillarResult: PillarResult,
): ReadonlyArray<string> {
  const pillarName = PILLAR_LABELS[pillarResult.pillar]
  return questions.filter(
    (q) =>
      q.includes(pillarName) ||
      pillarResult.blockers.some((b) => {
        if (b === 'STALE_LABS') return q.includes('lab panel')
        if (b === 'UNKNOWN_LABS') return q.includes('eGFR') || q.includes('potassium')
        if (b === 'ADR_HISTORY') return q.includes('adverse reaction')
        if (b === 'CLINICAL_INERTIA') return q.includes('no identified barrier')
        return false
      }),
  )
}

function EmptyState({ message }: { readonly message: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

function getRelevantGuidelineDifferences(
  pillar: Pillar,
  efCategory: EFCategory,
) {
  return guidelineDifferences.filter((d) => {
    if (pillar === 'SGLT2i' && efCategory === 'HFpEF' && d.topic === 'SGLT2i in HFpEF')
      return true
    if (pillar === 'MRA' && (efCategory === 'HFmrEF' || efCategory === 'HFpEF') && d.topic.includes('Finerenone'))
      return true
    if (pillar === 'ARNI_ACEi_ARB' && efCategory === 'HFrEF' && d.topic.includes('ARNI vs ACEi'))
      return true
    return false
  })
}

function PillarDetail({
  pillarResult,
  questions,
  efCategory,
}: {
  readonly pillarResult: PillarResult
  readonly questions: ReadonlyArray<string>
  readonly efCategory: EFCategory
}) {
  const { pillar, status, doseTier, blockers, missingInfo } = pillarResult
  const showPictograph = pillar === 'SGLT2i' && efCategory === 'HFrEF'
  const relevantDifferences = getRelevantGuidelineDifferences(pillar, efCategory)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          {PILLAR_LABELS[pillar]}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {STATUS_DESCRIPTIONS[status]}
        </p>
        {doseTier !== 'NOT_PRESCRIBED' && (
          <p className="mt-1 text-sm text-gray-500">
            Current: {DOSE_TIER_LABELS[doseTier]}
          </p>
        )}
      </div>

      {blockers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Identified Blockers
          </h4>
          <ul className="space-y-1.5">
            {blockers.map((code) => (
              <li key={code} className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400"
                  aria-hidden="true"
                />
                <BlockerLabel code={code} className="text-gray-700" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingInfo.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Missing Information
          </h4>
          <ul className="space-y-1">
            {missingInfo.map((info) => (
              <li
                key={info}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400"
                  aria-hidden="true"
                />
                {info}
              </li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Next Best Questions
          </h4>
          <ul className="space-y-1">
            {questions.map((q) => (
              <li
                key={q}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400"
                  aria-hidden="true"
                />
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {blockers.length > 0 && (
        <InertiaBuster pillar={pillar} blockerCodes={blockers} />
      )}

      {showPictograph ? (
        <Pictograph
          benefitCount={sglt2iPictographData.benefitCount}
          harmCount={sglt2iPictographData.harmCount}
          benefitLabel={sglt2iPictographData.benefitLabel}
          harmLabel={sglt2iPictographData.harmLabel}
          trialSource={sglt2iPictographData.trialSource}
          disclaimer={sglt2iPictographData.disclaimer}
        />
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 p-3">
          <p className="text-xs text-gray-400">
            Pictograph not available for this pillar/EF category
          </p>
        </div>
      )}

      {relevantDifferences.length > 0 && (
        <GuidelineComparisonPanel comparisons={relevantDifferences} />
      )}

      <RuleDerivedLabel className="mt-2" />
    </div>
  )
}

export function DetailPanel({ auditResult, selectedPillar }: DetailPanelProps) {
  if (!auditResult) {
    return (
      <EmptyState message="Enter patient data and click 'Run Audit' to begin" />
    )
  }

  if (!selectedPillar) {
    return <EmptyState message="Select a pillar card to view details" />
  }

  const pillarResult = findPillarResult(auditResult.pillarResults, selectedPillar)

  if (!pillarResult) {
    return <EmptyState message="Selected pillar not found in audit results" />
  }

  const questions = filterQuestionsForPillar(
    auditResult.nextBestQuestions,
    pillarResult,
  )

  return (
    <div className="p-4 overflow-y-auto h-full">
      <PillarDetail
        pillarResult={pillarResult}
        questions={questions}
        efCategory={auditResult.efCategory}
      />
    </div>
  )
}
