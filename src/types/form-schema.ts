import { z } from 'zod'

export const medicationFormSchema = z.object({
  pillar: z.string(),
  name: z.string(),
  doseTier: z.string(),
  hasADR: z.boolean().optional(),
  adrDescription: z.string().optional(),
  hasAllergy: z.boolean().optional(),
})

export const patientFormSchema = z.object({
  ef: z.number().min(1, 'EF must be 1-99%').max(99, 'EF must be 1-99%'),
  nyhaClass: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  sbp: z.number().min(60, 'SBP must be 60-250 mmHg').max(250, 'SBP must be 60-250 mmHg'),
  hr: z.number().min(30, 'HR must be 30-200 bpm').max(200, 'HR must be 30-200 bpm'),
  vitalsDate: z.string().min(1, 'Vitals date is required'),
  egfr: z.number().min(0, 'eGFR must be 0-200').max(200, 'eGFR must be 0-200').optional(),
  potassium: z.number().min(2.0, 'K+ must be 2.0-8.0').max(8.0, 'K+ must be 2.0-8.0').optional(),
  labsDate: z.string().optional(),
  bnp: z.number().optional(),
  ntProBnp: z.number().optional(),
  dmType: z.enum(['none', 'type1', 'type2']).optional(),
  medications: z.array(medicationFormSchema),
})

export type PatientFormData = z.infer<typeof patientFormSchema>
export type MedicationFormData = z.infer<typeof medicationFormSchema>
