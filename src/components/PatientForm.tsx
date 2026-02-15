import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PatientSnapshot } from '../types/patient.ts'
import type { ExtractionResult } from '../types/vision.ts'
import type { PatientTimeline } from '../types/timeline.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'
import { DOSE_TIERS } from '../types/dose-tier.ts'
import { usePatientForm } from '../hooks/usePatientForm.ts'
import { case1Patient } from '../data/cases/case1.ts'
import { case2Patient } from '../data/cases/case2.ts'
import { case3Patient } from '../data/cases/case3.ts'
import { case1Timeline } from '../data/timelines/case1-timeline.ts'
import { case2Timeline } from '../data/timelines/case2-timeline.ts'
import { case3Timeline } from '../data/timelines/case3-timeline.ts'
import { VisionExtractedLabel } from './labels/VisionExtractedLabel.tsx'

interface PatientFormProps {
  readonly onSubmit: (patient: PatientSnapshot, timeline?: PatientTimeline) => void
  readonly isLoading?: boolean
  readonly extractionResult?: ExtractionResult | null
  readonly onTimelineSelect?: (timeline: PatientTimeline | null) => void
}

function FormField({
  label,
  error,
  suffix,
  children,
}: {
  readonly label: React.ReactNode
  readonly error?: string
  readonly suffix?: string
  readonly children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 tracking-wide">
        {label}
      </label>
      {suffix ? (
        <div className="input-with-suffix">
          {children}
          <span className="input-suffix">{suffix}</span>
        </div>
      ) : (
        children
      )}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}

function FieldConfidenceBadge({ fieldName, confidence }: { readonly fieldName: string; readonly confidence?: ExtractionResult['confidence'] | null }) {
  if (!confidence) return null
  const status = confidence.fields[fieldName]
  if (!status || status === 'missing') return null
  const colors = status === 'extracted'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700'
  return (
    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors}`}>
      {status}
    </span>
  )
}

const PILLAR_ACCENT: Readonly<Record<string, string>> = {
  ARNI_ACEi_ARB: 'border-l-blue-500',
  BETA_BLOCKER: 'border-l-violet-500',
  MRA: 'border-l-amber-500',
  SGLT2i: 'border-l-emerald-500',
}

const PILLAR_DOT: Readonly<Record<string, string>> = {
  ARNI_ACEi_ARB: 'bg-blue-500',
  BETA_BLOCKER: 'bg-violet-500',
  MRA: 'bg-amber-500',
  SGLT2i: 'bg-emerald-500',
}

export function PatientForm({ onSubmit, isLoading = false, extractionResult, onTimelineSelect }: PatientFormProps) {
  const { t } = useTranslation()
  const { t: tc } = useTranslation('clinical')
  const {
    formState,
    errors,
    handleChange,
    handleMedicationChange,
    handleSubmit,
    loadCase,
    loadPartialSnapshot,
    resetForm,
  } = usePatientForm()

  const prevExtractionRef = useRef<ExtractionResult | null>(null)
  useEffect(() => {
    if (extractionResult && extractionResult !== prevExtractionRef.current && extractionResult.snapshot) {
      loadPartialSnapshot(extractionResult.snapshot)
      prevExtractionRef.current = extractionResult
    }
  }, [extractionResult, loadPartialSnapshot])

  const inputBase = 'w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-500 focus:bg-white placeholder:text-gray-300'

  const inputClass = (field: string) =>
    `${inputBase} ${errors[field] ? 'border-red-400 bg-red-50/50 focus:ring-red-500/30 focus:border-red-400' : ''}`

  const selectClass = (field: string) =>
    `${inputBase} ${errors[field] ? 'border-red-400 bg-red-50/50 focus:ring-red-500/30 focus:border-red-400' : ''}`

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = handleSubmit()
    if (result) {
      onSubmit(result)
    }
  }

  return (
    <form onSubmit={onFormSubmit} className="space-y-0 pb-4">
      {/* Demo Presets */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {t('form.demoPresets')}
          </span>
          <button
            type="button"
            onClick={() => { resetForm(); onTimelineSelect?.(null) }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('form.reset')}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { loadCase(case1Patient); onTimelineSelect?.(case1Timeline) }}
            className="flex-1 px-3 py-2 text-xs font-medium bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors border border-teal-100"
          >
            {t('form.case1')}
          </button>
          <button
            type="button"
            onClick={() => { loadCase(case2Patient); onTimelineSelect?.(case2Timeline) }}
            className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
          >
            {t('form.case2')}
          </button>
          <button
            type="button"
            onClick={() => { loadCase(case3Patient); onTimelineSelect?.(case3Timeline) }}
            className="flex-1 px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors border border-amber-100"
          >
            {t('form.case3')}
          </button>
        </div>
      </div>

      {extractionResult?.confidence && (
        <div className="mb-3 flex items-center gap-2">
          <VisionExtractedLabel />
          <span className="text-xs text-gray-400">
            {t('form.confidence', { level: extractionResult.confidence.overall })}
          </span>
        </div>
      )}

      {/* Patient Vitals */}
      <SectionCard title={t('form.vitals')}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={<>EF<FieldConfidenceBadge fieldName="ef" confidence={extractionResult?.confidence} /></>} error={errors['ef']} suffix="%">
            <input
              type="number"
              value={formState.ef}
              onChange={(e) => { handleChange('ef', e.target.value) }}
              placeholder="30"
              min={1}
              max={99}
              className={inputClass('ef')}
            />
          </FormField>

          <FormField label={<>NYHA<FieldConfidenceBadge fieldName="nyhaClass" confidence={extractionResult?.confidence} /></>} error={errors['nyhaClass']}>
            <select
              value={formState.nyhaClass}
              onChange={(e) => { handleChange('nyhaClass', e.target.value) }}
              className={selectClass('nyhaClass')}
            >
              <option value="1">{t('form.nyhaClass', { num: 'I' })}</option>
              <option value="2">{t('form.nyhaClass', { num: 'II' })}</option>
              <option value="3">{t('form.nyhaClass', { num: 'III' })}</option>
              <option value="4">{t('form.nyhaClass', { num: 'IV' })}</option>
            </select>
          </FormField>

          <FormField label={<>SBP<FieldConfidenceBadge fieldName="sbp" confidence={extractionResult?.confidence} /></>} error={errors['sbp']} suffix="mmHg">
            <input
              type="number"
              value={formState.sbp}
              onChange={(e) => { handleChange('sbp', e.target.value) }}
              placeholder="120"
              min={60}
              max={250}
              className={inputClass('sbp')}
            />
          </FormField>

          <FormField label={<>HR<FieldConfidenceBadge fieldName="hr" confidence={extractionResult?.confidence} /></>} error={errors['hr']} suffix="bpm">
            <input
              type="number"
              value={formState.hr}
              onChange={(e) => { handleChange('hr', e.target.value) }}
              placeholder="72"
              min={30}
              max={200}
              className={inputClass('hr')}
            />
          </FormField>
        </div>

        <div className="mt-3">
          <FormField label={<>{t('form.vitalsDate')}<FieldConfidenceBadge fieldName="vitalsDate" confidence={extractionResult?.confidence} /></>} error={errors['vitalsDate']}>
            <input
              type="date"
              value={formState.vitalsDate}
              onChange={(e) => { handleChange('vitalsDate', e.target.value) }}
              className={inputClass('vitalsDate')}
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Laboratory Values */}
      <SectionCard title={t('form.labs')}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={<>eGFR<FieldConfidenceBadge fieldName="egfr" confidence={extractionResult?.confidence} /></>} error={errors['egfr']} suffix="mL/min">
            <input
              type="number"
              value={formState.egfr}
              onChange={(e) => { handleChange('egfr', e.target.value) }}
              placeholder="--"
              min={0}
              max={200}
              className={inputClass('egfr')}
            />
          </FormField>

          <FormField label={<>K+<FieldConfidenceBadge fieldName="potassium" confidence={extractionResult?.confidence} /></>} error={errors['potassium']} suffix="mEq/L">
            <input
              type="number"
              value={formState.potassium}
              onChange={(e) => { handleChange('potassium', e.target.value) }}
              placeholder="--"
              step={0.1}
              min={2.0}
              max={8.0}
              className={inputClass('potassium')}
            />
          </FormField>

          <FormField label={<>{t('form.labsDate')}<FieldConfidenceBadge fieldName="labsDate" confidence={extractionResult?.confidence} /></>} error={errors['labsDate']}>
            <input
              type="date"
              value={formState.labsDate}
              onChange={(e) => { handleChange('labsDate', e.target.value) }}
              className={inputClass('labsDate')}
            />
          </FormField>

          <FormField
            label={
              <>
                <select
                  value={formState.biomarkerType}
                  onChange={(e) => { handleChange('biomarkerType', e.target.value) }}
                  className="text-xs font-medium text-gray-500 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                >
                  <option value="bnp">BNP</option>
                  <option value="ntProBnp">NT-proBNP</option>
                </select>
                <FieldConfidenceBadge fieldName={formState.biomarkerType === 'bnp' ? 'bnp' : 'ntProBnp'} confidence={extractionResult?.confidence} />
              </>
            }
            error={errors[formState.biomarkerType === 'bnp' ? 'bnp' : 'ntProBnp']}
            suffix="pg/mL"
          >
            <input
              type="number"
              value={formState.biomarkerType === 'bnp' ? formState.bnp : formState.ntProBnp}
              onChange={(e) => { handleChange(formState.biomarkerType === 'bnp' ? 'bnp' : 'ntProBnp', e.target.value) }}
              placeholder={formState.biomarkerType === 'bnp' ? t('form.bnpHint') : t('form.ntProBnpHint')}
              className={inputClass(formState.biomarkerType === 'bnp' ? 'bnp' : 'ntProBnp')}
            />
          </FormField>
        </div>
      </SectionCard>

      {/* Comorbidities */}
      <SectionCard title={t('form.comorbidities')}>
        <FormField label={<>Diabetes<FieldConfidenceBadge fieldName="dmType" confidence={extractionResult?.confidence} /></>} error={errors['dmType']}>
          <select
            value={formState.dmType}
            onChange={(e) => { handleChange('dmType', e.target.value) }}
            className={selectClass('dmType')}
          >
            <option value="none">{t('form.diabetesNone')}</option>
            <option value="type1">{t('form.diabetesType1')}</option>
            <option value="type2">{t('form.diabetesType2')}</option>
          </select>
        </FormField>
      </SectionCard>

      {/* Current Medications */}
      <SectionCard title={t('form.medications')}>
        <div className="space-y-2">
          {formState.medications.map((med, index) => {
            const pillarKey = med.pillar as keyof typeof PILLAR_LABELS
            const accent = PILLAR_ACCENT[med.pillar] ?? 'border-l-gray-300'
            const dot = PILLAR_DOT[med.pillar] ?? 'bg-gray-400'
            const isActive = med.doseTier !== 'NOT_PRESCRIBED' && med.name !== ''

            return (
              <div
                key={med.pillar}
                className={`border-l-[3px] ${accent} rounded-r-lg p-3 transition-colors ${
                  isActive
                    ? 'bg-white border border-l-0 border-gray-100 shadow-sm'
                    : 'bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-xs font-semibold text-gray-700">
                    {PILLAR_LABELS[pillarKey] ?? med.pillar}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {t('form.active')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => { handleMedicationChange(index, 'name', e.target.value) }}
                    placeholder={t('form.drugName')}
                    className={`${inputBase} text-xs py-1.5 ${
                      errors[`medications.${String(index)}.name`] ? 'border-red-400' : ''
                    }`}
                  />
                  <select
                    value={med.doseTier}
                    onChange={(e) => { handleMedicationChange(index, 'doseTier', e.target.value) }}
                    className={`${inputBase} text-xs py-1.5 ${
                      errors[`medications.${String(index)}.doseTier`] ? 'border-red-400' : ''
                    }`}
                  >
                    {Object.values(DOSE_TIERS).map((tier) => (
                      <option key={tier} value={tier}>
                        {tc(`doseTier.${tier}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={med.hasADR}
                      onChange={(e) => { handleMedicationChange(index, 'hasADR', e.target.checked) }}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-gray-200 peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-400" />
                    <span className="ms-1.5 text-[11px] text-gray-500">ADR</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={med.hasAllergy}
                      onChange={(e) => { handleMedicationChange(index, 'hasAllergy', e.target.checked) }}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-gray-200 peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-400" />
                    <span className="ms-1.5 text-[11px] text-gray-500">{t('form.allergy')}</span>
                  </label>
                </div>

                {med.hasADR && (
                  <input
                    type="text"
                    value={med.adrDescription}
                    onChange={(e) => { handleMedicationChange(index, 'adrDescription', e.target.value) }}
                    placeholder={t('form.describeADR')}
                    className={`${inputBase} text-xs py-1.5 mt-2`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 text-sm font-bold text-white bg-teal-700 rounded-lg shadow-sm shadow-teal-700/20 hover:bg-teal-800 hover:shadow-teal-800/25 active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-150"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t('form.runningAudit')}
          </span>
        ) : (
          t('form.runAudit')
        )}
      </button>
    </form>
  )
}
