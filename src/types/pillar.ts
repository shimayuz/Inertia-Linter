export const PILLARS = {
  // Heart Failure
  ARNI_ACEi_ARB: 'ARNI_ACEi_ARB',
  BETA_BLOCKER: 'BETA_BLOCKER',
  MRA: 'MRA',
  SGLT2i: 'SGLT2i',
  // Diabetes Management
  METFORMIN: 'METFORMIN',
  SGLT2i_DM: 'SGLT2i_DM',
  GLP1_RA: 'GLP1_RA',
  INSULIN: 'INSULIN',
  // Hypertension Control
  ACEi_ARB_HTN: 'ACEi_ARB_HTN',
  CCB: 'CCB',
  THIAZIDE: 'THIAZIDE',
  BETA_BLOCKER_HTN: 'BETA_BLOCKER_HTN',
} as const

export type Pillar = typeof PILLARS[keyof typeof PILLARS]

export const HF_PILLARS: ReadonlyArray<Pillar> = [
  PILLARS.ARNI_ACEi_ARB,
  PILLARS.BETA_BLOCKER,
  PILLARS.MRA,
  PILLARS.SGLT2i,
] as const

export const DM_PILLARS: ReadonlyArray<Pillar> = [
  PILLARS.METFORMIN,
  PILLARS.SGLT2i_DM,
  PILLARS.GLP1_RA,
  PILLARS.INSULIN,
] as const

export const HTN_PILLARS: ReadonlyArray<Pillar> = [
  PILLARS.ACEi_ARB_HTN,
  PILLARS.CCB,
  PILLARS.THIAZIDE,
  PILLARS.BETA_BLOCKER_HTN,
] as const

export const PILLAR_LABELS: Readonly<Record<Pillar, string>> = {
  ARNI_ACEi_ARB: 'ARNI/ACEi/ARB',
  BETA_BLOCKER: 'Beta-blocker',
  MRA: 'MRA',
  SGLT2i: 'SGLT2i',
  METFORMIN: 'Metformin',
  SGLT2i_DM: 'SGLT2i',
  GLP1_RA: 'GLP-1 RA',
  INSULIN: 'Insulin',
  ACEi_ARB_HTN: 'ACEi/ARB',
  CCB: 'CCB',
  THIAZIDE: 'Thiazide',
  BETA_BLOCKER_HTN: 'Beta-blocker',
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
