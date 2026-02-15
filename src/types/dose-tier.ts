export const DOSE_TIERS = {
  NOT_PRESCRIBED: 'NOT_PRESCRIBED',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const

export type DoseTier = typeof DOSE_TIERS[keyof typeof DOSE_TIERS]

export const DOSE_TIER_POINTS: Readonly<Record<DoseTier, number>> = {
  NOT_PRESCRIBED: 0,
  LOW: 8,
  MEDIUM: 16,
  HIGH: 25,
} as const

export const DOSE_TIER_LABELS: Readonly<Record<DoseTier, string>> = {
  NOT_PRESCRIBED: 'Not prescribed',
  LOW: 'Minimum dose',
  MEDIUM: 'Medium dose',
  HIGH: 'Max dose',
} as const
