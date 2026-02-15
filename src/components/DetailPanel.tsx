import { useTranslation } from 'react-i18next'
import type { AuditResult, PillarResult } from '../types/audit'
import type { EFCategory } from '../types/ef-category'
import type { Pillar } from '../types/pillar'
import type { Medication } from '../types/patient'
import { PILLAR_LABELS } from '../types/pillar'
import { BlockerLabel } from './labels/BlockerLabel'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'
import { TitrationSchedule } from './TitrationSchedule'
import { Pictograph } from './Pictograph'
import { GuidelineComparisonPanel } from './GuidelineComparison'
import { InertiaBuster } from './InertiaBuster'
import { sglt2iPictographData } from '../data/pictograph-sglt2i-hfref'
import { guidelineDifferences } from '../data/guideline-differences'

interface DetailPanelProps {
  readonly auditResult: AuditResult | null
  readonly selectedPillar: Pillar | null
  readonly medications?: ReadonlyArray<Medication>
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
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-6">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-400">{message}</p>
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

function findMedicationForPillar(
  medications: ReadonlyArray<Medication> | undefined,
  pillar: Pillar,
): Medication | undefined {
  if (!medications) return undefined
  return medications.find((m) => m.pillar === pillar)
}

function PillarDetail({
  pillarResult,
  questions,
  efCategory,
  medications,
}: {
  readonly pillarResult: PillarResult
  readonly questions: ReadonlyArray<string>
  readonly efCategory: EFCategory
  readonly medications?: ReadonlyArray<Medication>
}) {
  const { t } = useTranslation()
  const { t: tc } = useTranslation('clinical')
  const { pillar, status, doseTier, blockers, missingInfo } = pillarResult
  const showPictograph = pillar === 'SGLT2i' && efCategory === 'HFrEF'
  const relevantDifferences = getRelevantGuidelineDifferences(pillar, efCategory)
  const medication = findMedicationForPillar(medications, pillar)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          {PILLAR_LABELS[pillar]}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {tc(`statusDesc.${status}`)}
        </p>
        {doseTier !== 'NOT_PRESCRIBED' && (
          <p className="mt-1 text-sm text-gray-500">
            {t('detail.current', { dose: tc(`doseTier.${doseTier}`) })}
          </p>
        )}
      </div>

      <TitrationSchedule
        pillar={pillar}
        currentDoseTier={doseTier}
        currentDrugName={medication?.name ?? ''}
        status={status}
      />

      {blockers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            {t('detail.identifiedBlockers')}
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
            {t('detail.missingInformation')}
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
            {t('detail.nextBestQuestions')}
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
            {t('detail.pictographNotAvailable')}
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

export function DetailPanel({ auditResult, selectedPillar, medications }: DetailPanelProps) {
  const { t } = useTranslation()

  if (!auditResult) {
    return (
      <EmptyState message={t('detail.emptyAudit')} />
    )
  }

  if (!selectedPillar) {
    return <EmptyState message={t('detail.emptyPillar')} />
  }

  const pillarResult = findPillarResult(auditResult.pillarResults, selectedPillar)

  if (!pillarResult) {
    return <EmptyState message={t('detail.emptyNotFound')} />
  }

  const questions = filterQuestionsForPillar(
    auditResult.nextBestQuestions,
    pillarResult,
  )

  return (
    <div className="p-5 overflow-y-auto h-full bg-white rounded-xl border border-gray-100 shadow-sm">
      <PillarDetail
        pillarResult={pillarResult}
        questions={questions}
        efCategory={auditResult.efCategory}
        medications={medications}
      />
    </div>
  )
}
