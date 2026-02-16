import type { EFCategory } from '../types/ef-category.ts'

export interface ICD10Code {
  readonly code: string
  readonly description: string
}

export const HF_ICD10_CODES: Readonly<Record<EFCategory, ICD10Code>> = {
  HFrEF: {
    code: 'I50.22',
    description: 'Chronic systolic (congestive) heart failure',
  },
  HFmrEF: {
    code: 'I50.22',
    description: 'Chronic systolic (congestive) heart failure',
  },
  HFpEF: {
    code: 'I50.32',
    description: 'Chronic diastolic (congestive) heart failure',
  },
} as const

export function getICD10ForEF(efCategory: EFCategory): ICD10Code {
  return HF_ICD10_CODES[efCategory]
}
