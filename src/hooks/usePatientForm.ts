import { useState, useCallback } from 'react'
import { patientFormSchema } from '../types/form-schema.ts'
import type { PatientFormData } from '../types/form-schema.ts'
import type { PatientSnapshot, Medication } from '../types/patient.ts'
import type { Pillar } from '../types/pillar.ts'
import { PILLARS } from '../types/pillar.ts'
import type { DoseTier } from '../types/dose-tier.ts'

interface MedicationFormEntry {
  readonly pillar: string
  readonly name: string
  readonly doseTier: string
  readonly hasADR: boolean
  readonly adrDescription: string
  readonly hasAllergy: boolean
}

interface FormState {
  readonly ef: string
  readonly nyhaClass: string
  readonly sbp: string
  readonly hr: string
  readonly vitalsDate: string
  readonly egfr: string
  readonly potassium: string
  readonly labsDate: string
  readonly bnp: string
  readonly biomarkerType: 'bnp' | 'ntProBnp'
  readonly ntProBnp: string
  readonly dmType: string
  readonly medications: ReadonlyArray<MedicationFormEntry>
}

interface FormErrors {
  readonly [key: string]: string | undefined
}

function createDefaultMedications(): ReadonlyArray<MedicationFormEntry> {
  return Object.values(PILLARS).map((pillar) => ({
    pillar,
    name: '',
    doseTier: 'NOT_PRESCRIBED',
    hasADR: false,
    adrDescription: '',
    hasAllergy: false,
  }))
}

function createDefaultFormState(): FormState {
  return {
    ef: '',
    nyhaClass: '2',
    sbp: '',
    hr: '',
    vitalsDate: new Date().toISOString().split('T')[0]!,
    egfr: '',
    potassium: '',
    labsDate: '',
    bnp: '',
    biomarkerType: 'bnp',
    ntProBnp: '',
    dmType: 'none',
    medications: createDefaultMedications(),
  }
}

function parseFormToData(state: FormState): PatientFormData {
  return {
    ef: Number(state.ef),
    nyhaClass: Number(state.nyhaClass) as 1 | 2 | 3 | 4,
    sbp: Number(state.sbp),
    hr: Number(state.hr),
    vitalsDate: state.vitalsDate,
    egfr: state.egfr ? Number(state.egfr) : undefined,
    potassium: state.potassium ? Number(state.potassium) : undefined,
    labsDate: state.labsDate || undefined,
    bnp: state.bnp ? Number(state.bnp) : undefined,
    ntProBnp: state.ntProBnp ? Number(state.ntProBnp) : undefined,
    dmType: (state.dmType || 'none') as 'none' | 'type1' | 'type2',
    medications: state.medications.map((med) => ({
      pillar: med.pillar,
      name: med.name,
      doseTier: med.doseTier,
      hasADR: med.hasADR || undefined,
      adrDescription: med.adrDescription || undefined,
      hasAllergy: med.hasAllergy || undefined,
    })),
  }
}

function formDataToSnapshot(data: PatientFormData): PatientSnapshot {
  const medications: ReadonlyArray<Medication> = data.medications.map((med) => ({
    pillar: med.pillar as Pillar,
    name: med.name,
    doseTier: med.doseTier as DoseTier,
    hasADR: med.hasADR,
    adrDescription: med.adrDescription,
    hasAllergy: med.hasAllergy,
  }))
  return {
    ef: data.ef,
    nyhaClass: data.nyhaClass,
    sbp: data.sbp,
    hr: data.hr,
    vitalsDate: data.vitalsDate,
    egfr: data.egfr,
    potassium: data.potassium,
    labsDate: data.labsDate,
    bnp: data.bnp,
    ntProBnp: data.ntProBnp,
    dmType: data.dmType,
    medications,
  }
}

function snapshotToFormState(patient: PatientSnapshot): FormState {
  return {
    ef: String(patient.ef),
    nyhaClass: String(patient.nyhaClass),
    sbp: String(patient.sbp),
    hr: String(patient.hr),
    vitalsDate: patient.vitalsDate,
    egfr: patient.egfr !== undefined ? String(patient.egfr) : '',
    potassium: patient.potassium !== undefined ? String(patient.potassium) : '',
    labsDate: patient.labsDate ?? '',
    bnp: patient.bnp !== undefined ? String(patient.bnp) : '',
    biomarkerType: patient.ntProBnp !== undefined ? 'ntProBnp' : 'bnp',
    ntProBnp: patient.ntProBnp !== undefined ? String(patient.ntProBnp) : '',
    dmType: patient.dmType ?? 'none',
    medications: Object.values(PILLARS).map((pillar) => {
      const med = patient.medications.find((m) => m.pillar === pillar)
      return {
        pillar,
        name: med?.name ?? '',
        doseTier: med?.doseTier ?? 'NOT_PRESCRIBED',
        hasADR: med?.hasADR ?? false,
        adrDescription: med?.adrDescription ?? '',
        hasAllergy: med?.hasAllergy ?? false,
      }
    }),
  }
}

function flattenZodErrors(error: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> }): FormErrors {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.')
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }
  return errors
}

export function usePatientForm() {
  const [formState, setFormState] = useState<FormState>(createDefaultFormState)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormState((prev) => {
      if (field === 'biomarkerType') {
        return {
          ...prev,
          biomarkerType: value as 'bnp' | 'ntProBnp',
          bnp: '',
          ntProBnp: '',
        }
      }
      return {
        ...prev,
        [field]: value,
      }
    })
    setErrors((prev) => {
      if (!prev[field]) return prev
      const { [field]: _, ...rest } = prev as Record<string, string | undefined>
      void _
      return rest
    })
  }, [])

  const handleMedicationChange = useCallback(
    (index: number, field: string, value: string | boolean) => {
      setFormState((prev) => ({
        ...prev,
        medications: prev.medications.map((med, i) =>
          i === index ? { ...med, [field]: value } : med
        ),
      }))
      setErrors((prev) => {
        const key = `medications.${String(index)}.${field}`
        if (!prev[key]) return prev
        const { [key]: _, ...rest } = prev as Record<string, string | undefined>
        void _
        return rest
      })
    },
    []
  )

  const handleSubmit = useCallback((): PatientSnapshot | null => {
    const parsed = parseFormToData(formState)
    const result = patientFormSchema.safeParse(parsed)

    if (!result.success) {
      setErrors(flattenZodErrors(result.error))
      return null
    }

    setErrors({})
    return formDataToSnapshot(result.data)
  }, [formState])

  const loadCase = useCallback((patient: PatientSnapshot) => {
    setFormState(snapshotToFormState(patient))
    setErrors({})
  }, [])

  const loadPartialSnapshot = useCallback((partial: Partial<PatientSnapshot>) => {
    setFormState((prev) => {
      const next = { ...prev }

      if (partial.ef !== undefined) next.ef = String(partial.ef)
      if (partial.nyhaClass !== undefined) next.nyhaClass = String(partial.nyhaClass)
      if (partial.sbp !== undefined) next.sbp = String(partial.sbp)
      if (partial.hr !== undefined) next.hr = String(partial.hr)
      if (partial.vitalsDate !== undefined) next.vitalsDate = partial.vitalsDate
      if (partial.egfr !== undefined) next.egfr = String(partial.egfr)
      if (partial.potassium !== undefined) next.potassium = String(partial.potassium)
      if (partial.labsDate !== undefined) next.labsDate = partial.labsDate
      if (partial.bnp !== undefined) next.bnp = String(partial.bnp)
      if (partial.ntProBnp !== undefined) next.ntProBnp = String(partial.ntProBnp)
      if (partial.dmType !== undefined) next.dmType = partial.dmType

      if (partial.medications) {
        const meds = Object.values(PILLARS).map((pillar) => {
          const extracted = partial.medications?.find((m) => m.pillar === pillar)
          const existing = prev.medications.find((m) => m.pillar === pillar)
          if (extracted && extracted.name) {
            return {
              pillar,
              name: extracted.name,
              doseTier: extracted.doseTier,
              hasADR: existing?.hasADR ?? false,
              adrDescription: existing?.adrDescription ?? '',
              hasAllergy: existing?.hasAllergy ?? false,
            }
          }
          return existing ?? {
            pillar,
            name: '',
            doseTier: 'NOT_PRESCRIBED',
            hasADR: false,
            adrDescription: '',
            hasAllergy: false,
          }
        })
        return { ...next, medications: meds }
      }

      return next
    })
    setErrors({})
  }, [])

  const resetForm = useCallback(() => {
    setFormState(createDefaultFormState())
    setErrors({})
  }, [])

  return {
    formState,
    errors,
    handleChange,
    handleMedicationChange,
    handleSubmit,
    loadCase,
    loadPartialSnapshot,
    resetForm,
  } as const
}
