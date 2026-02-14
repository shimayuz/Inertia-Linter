import type { PatientSnapshot } from '../types/patient.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'
import { DOSE_TIERS, DOSE_TIER_LABELS } from '../types/dose-tier.ts'
import { usePatientForm } from '../hooks/usePatientForm.ts'
import { case1Patient } from '../data/cases/case1.ts'
import { case2Patient } from '../data/cases/case2.ts'
import { case3Patient } from '../data/cases/case3.ts'

interface PatientFormProps {
  readonly onSubmit: (patient: PatientSnapshot) => void
  readonly isLoading?: boolean
}

function FormField({
  label,
  error,
  children,
}: {
  readonly label: string
  readonly error?: string
  readonly children: React.ReactNode
}) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-700 mb-0.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  )
}

function SectionHeader({ title }: { readonly title: string }) {
  return (
    <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 mb-2 mt-3 first:mt-0">
      {title}
    </h3>
  )
}

export function PatientForm({ onSubmit, isLoading = false }: PatientFormProps) {
  const {
    formState,
    errors,
    handleChange,
    handleMedicationChange,
    handleSubmit,
    loadCase,
    resetForm,
  } = usePatientForm()

  const inputClass = (field: string) =>
    `w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`

  const selectClass = (field: string) =>
    `w-full px-2 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = handleSubmit()
    if (result) {
      onSubmit(result)
    }
  }

  return (
    <form onSubmit={onFormSubmit} className="p-3 space-y-1 overflow-y-auto h-full">
      {/* Quick-fill buttons */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Quick-fill demo cases:</p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => { loadCase(case1Patient) }}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Case 1: HFrEF
          </button>
          <button
            type="button"
            onClick={() => { loadCase(case2Patient) }}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Case 2: HFpEF
          </button>
          <button
            type="button"
            onClick={() => { loadCase(case3Patient) }}
            className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
          >
            Case 3: Multi-blocker
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Patient Vitals */}
      <SectionHeader title="Patient Vitals" />

      <div className="grid grid-cols-2 gap-2">
        <FormField label="EF (%)" error={errors['ef']}>
          <input
            type="number"
            value={formState.ef}
            onChange={(e) => { handleChange('ef', e.target.value) }}
            placeholder="1-99"
            min={1}
            max={99}
            className={inputClass('ef')}
          />
        </FormField>

        <FormField label="NYHA Class" error={errors['nyhaClass']}>
          <select
            value={formState.nyhaClass}
            onChange={(e) => { handleChange('nyhaClass', e.target.value) }}
            className={selectClass('nyhaClass')}
          >
            <option value="1">I</option>
            <option value="2">II</option>
            <option value="3">III</option>
            <option value="4">IV</option>
          </select>
        </FormField>

        <FormField label="SBP (mmHg)" error={errors['sbp']}>
          <input
            type="number"
            value={formState.sbp}
            onChange={(e) => { handleChange('sbp', e.target.value) }}
            placeholder="60-250"
            min={60}
            max={250}
            className={inputClass('sbp')}
          />
        </FormField>

        <FormField label="HR (bpm)" error={errors['hr']}>
          <input
            type="number"
            value={formState.hr}
            onChange={(e) => { handleChange('hr', e.target.value) }}
            placeholder="30-200"
            min={30}
            max={200}
            className={inputClass('hr')}
          />
        </FormField>
      </div>

      <FormField label="Vitals Date" error={errors['vitalsDate']}>
        <input
          type="date"
          value={formState.vitalsDate}
          onChange={(e) => { handleChange('vitalsDate', e.target.value) }}
          className={inputClass('vitalsDate')}
        />
      </FormField>

      {/* Laboratory Values */}
      <SectionHeader title="Laboratory Values" />

      <div className="grid grid-cols-2 gap-2">
        <FormField label="eGFR (mL/min)" error={errors['egfr']}>
          <input
            type="number"
            value={formState.egfr}
            onChange={(e) => { handleChange('egfr', e.target.value) }}
            placeholder="Optional"
            min={0}
            max={200}
            className={inputClass('egfr')}
          />
        </FormField>

        <FormField label="K+ (mEq/L)" error={errors['potassium']}>
          <input
            type="number"
            value={formState.potassium}
            onChange={(e) => { handleChange('potassium', e.target.value) }}
            placeholder="Optional"
            step={0.1}
            min={2.0}
            max={8.0}
            className={inputClass('potassium')}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FormField label="Labs Date" error={errors['labsDate']}>
          <input
            type="date"
            value={formState.labsDate}
            onChange={(e) => { handleChange('labsDate', e.target.value) }}
            className={inputClass('labsDate')}
          />
        </FormField>

        <FormField label="BNP (pg/mL)" error={errors['bnp']}>
          <input
            type="number"
            value={formState.bnp}
            onChange={(e) => { handleChange('bnp', e.target.value) }}
            placeholder="Optional"
            className={inputClass('bnp')}
          />
        </FormField>
      </div>

      {/* Comorbidities */}
      <SectionHeader title="Comorbidities" />

      <FormField label="Diabetes" error={errors['dmType']}>
        <select
          value={formState.dmType}
          onChange={(e) => { handleChange('dmType', e.target.value) }}
          className={selectClass('dmType')}
        >
          <option value="none">None</option>
          <option value="type1">Type 1</option>
          <option value="type2">Type 2</option>
        </select>
      </FormField>

      {/* Current Medications */}
      <SectionHeader title="Current Medications" />

      {formState.medications.map((med, index) => {
        const pillarKey = med.pillar as keyof typeof PILLAR_LABELS
        return (
          <div
            key={med.pillar}
            className="border border-gray-200 rounded p-2 mb-2"
          >
            <p className="text-xs font-semibold text-gray-700 mb-1">
              {PILLAR_LABELS[pillarKey]}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="Medication"
                error={errors[`medications.${String(index)}.name`]}
              >
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) => { handleMedicationChange(index, 'name', e.target.value) }}
                  placeholder="Drug name + dose"
                  className={inputClass(`medications.${String(index)}.name`)}
                />
              </FormField>

              <FormField
                label="Dose Tier"
                error={errors[`medications.${String(index)}.doseTier`]}
              >
                <select
                  value={med.doseTier}
                  onChange={(e) => { handleMedicationChange(index, 'doseTier', e.target.value) }}
                  className={selectClass(`medications.${String(index)}.doseTier`)}
                >
                  {Object.values(DOSE_TIERS).map((tier) => (
                    <option key={tier} value={tier}>
                      {DOSE_TIER_LABELS[tier]}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={med.hasADR}
                  onChange={(e) => { handleMedicationChange(index, 'hasADR', e.target.checked) }}
                  className="rounded border-gray-300"
                />
                ADR history
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={med.hasAllergy}
                  onChange={(e) => { handleMedicationChange(index, 'hasAllergy', e.target.checked) }}
                  className="rounded border-gray-300"
                />
                Allergy
              </label>
            </div>

            {med.hasADR && (
              <FormField
                label="ADR Description"
                error={errors[`medications.${String(index)}.adrDescription`]}
              >
                <input
                  type="text"
                  value={med.adrDescription}
                  onChange={(e) => { handleMedicationChange(index, 'adrDescription', e.target.value) }}
                  placeholder="Describe adverse reaction"
                  className={inputClass(`medications.${String(index)}.adrDescription`)}
                />
              </FormField>
            )}
          </div>
        )
      })}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-3 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Running Audit...' : 'Run Audit'}
      </button>
    </form>
  )
}
