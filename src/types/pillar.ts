export const PILLARS = {
  ARNI_ACEi_ARB: 'ARNI_ACEi_ARB',
  BETA_BLOCKER: 'BETA_BLOCKER',
  MRA: 'MRA',
  SGLT2i: 'SGLT2i',
} as const

export type Pillar = typeof PILLARS[keyof typeof PILLARS]

export const PILLAR_LABELS: Readonly<Record<Pillar, string>> = {
  ARNI_ACEi_ARB: 'ARNI/ACEi/ARB',
  BETA_BLOCKER: 'Beta-blocker',
  MRA: 'MRA',
  SGLT2i: 'SGLT2i',
} as const

export const PILLAR_STATUSES = {
  ON_TARGET: 'ON_TARGET',
  UNDERDOSED: 'UNDERDOSED',
  MISSING: 'MISSING',
  CONTRAINDICATED: 'CONTRAINDICATED',
  UNKNOWN: 'UNKNOWN',
} as const

export type PillarStatus = typeof PILLAR_STATUSES[keyof typeof PILLAR_STATUSES]

export const PILLAR_STATUS_COLORS: Readonly<Record<PillarStatus, string>> = {
  ON_TARGET: 'green',
  UNDERDOSED: 'amber',
  MISSING: 'red',
  CONTRAINDICATED: 'gray',
  UNKNOWN: 'purple',
} as const
