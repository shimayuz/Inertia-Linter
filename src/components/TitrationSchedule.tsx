import { useTranslation } from 'react-i18next'
import type { Pillar, PillarStatus } from '../types/pillar'
import type { DoseTier } from '../types/dose-tier'
import { matchTargetDose, getCurrentStepIndex } from '../engine/match-target-dose'
import { RuleDerivedLabel } from './labels/RuleDerivedLabel'

interface TitrationScheduleProps {
  readonly pillar: Pillar
  readonly currentDoseTier: DoseTier
  readonly currentDrugName: string
  readonly status: PillarStatus
}

function StepBadge({
  label,
  variant,
}: {
  readonly label: string
  readonly variant: 'current' | 'future' | 'target' | 'past'
}) {
  const baseClasses = 'px-3 py-1.5 rounded-full text-xs font-medium font-mono whitespace-nowrap'
  const variantClasses = {
    current: 'bg-blue-600 text-white',
    future: 'border border-gray-300 text-gray-500 bg-white',
    target: 'bg-green-600 text-white',
    past: 'bg-gray-200 text-gray-400',
  } as const

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {label}
    </span>
  )
}

function StepConnector() {
  return (
    <span
      className="flex-shrink-0 w-6 h-0.5 bg-gray-300 self-center"
      aria-hidden="true"
    />
  )
}

export function TitrationSchedule({
  pillar,
  currentDoseTier,
  currentDrugName,
  status,
}: TitrationScheduleProps) {
  const { t } = useTranslation('ui')

  if (status !== 'UNDERDOSED' && status !== 'MISSING') {
    return null
  }

  const drugData = matchTargetDose(pillar, currentDrugName)

  if (!drugData) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 p-3">
        <p className="text-xs text-gray-500">
          {t('titration.selectDrug')}
        </p>
      </div>
    )
  }

  const currentIndex = getCurrentStepIndex(drugData, currentDoseTier)
  const lastIndex = drugData.steps.length - 1

  function getStepVariant(
    stepIndex: number,
    currentIdx: number,
    lastIdx: number,
  ): 'current' | 'future' | 'target' | 'past' {
    if (stepIndex < currentIdx) return 'past'
    if (stepIndex === currentIdx) return 'current'
    if (stepIndex === lastIdx) return 'target'
    return 'future'
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">
        {t('titration.schedule', { drug: drugData.genericName })}
      </h4>

      <div className="flex items-center gap-0 overflow-x-auto py-2">
        {drugData.steps.map((step, i) => {
          const variant = getStepVariant(i, currentIndex, lastIndex)
          return (
            <div key={step.label} className="flex items-center">
              {i > 0 && <StepConnector />}
              <div className="flex flex-col items-center gap-1">
                <StepBadge label={step.label} variant={variant} />
                {step.note && (
                  <span className="text-[10px] text-gray-400 max-w-[100px] text-center">
                    {step.note}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        {currentIndex >= 0 && currentIndex < drugData.monitoringPerStep.length && (
          <p>
            {t('titration.monitoring', { text: drugData.monitoringPerStep[currentIndex] })}
          </p>
        )}
        <p>
          {t('titration.interval', { text: drugData.titrationInterval })}
        </p>
        <p>
          {t('titration.target', { text: drugData.targetDose })}
        </p>
        <p className="text-[10px] text-gray-400">
          {t('titration.source', { source: drugData.guidelineSource, doi: drugData.doi })}
        </p>
      </div>

      <RuleDerivedLabel />
    </div>
  )
}
