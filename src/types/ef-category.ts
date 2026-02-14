export const EF_CATEGORIES = {
  HFrEF: 'HFrEF',
  HFmrEF: 'HFmrEF',
  HFpEF: 'HFpEF',
} as const

export type EFCategory = typeof EF_CATEGORIES[keyof typeof EF_CATEGORIES]

export const EF_THRESHOLDS = {
  HFrEF_MAX: 40,
  HFmrEF_MIN: 41,
  HFmrEF_MAX: 49,
  HFpEF_MIN: 50,
} as const
