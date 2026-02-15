import { z } from 'zod'
import type { Medication } from '../types/patient.ts'

const VALID_PILLARS = ['ARNI_ACEi_ARB', 'BETA_BLOCKER', 'MRA', 'SGLT2i'] as const

function normalizePillar(raw: string): string {
  if (raw === 'ARNI' || raw === 'ACEi_ARB') return 'ARNI_ACEi_ARB'
  return raw
}
const VALID_DOSE_TIERS = ['NOT_PRESCRIBED', 'LOW', 'MEDIUM', 'HIGH'] as const

const visionMedicationSchema = z.object({
  pillar: z.string(),
  name: z.string(),
  doseTier: z.string(),
})

const visionResponseSchema = z.object({
  ef: z.number().min(1).max(99).nullable(),
  nyhaClass: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).nullable(),
  sbp: z.number().min(60).max(250).nullable(),
  hr: z.number().min(30).max(200).nullable(),
  vitalsDate: z.string().nullable(),
  egfr: z.number().min(0).max(200).nullable().optional(),
  potassium: z.number().min(2.0).max(8.0).nullable().optional(),
  labsDate: z.string().nullable().optional(),
  bnp: z.number().nullable().optional(),
  dmType: z.enum(['none', 'type1', 'type2']).nullable().optional(),
  medications: z.array(visionMedicationSchema),
  confidence: z.object({
    overall: z.enum(['high', 'medium', 'low']),
    fields: z.record(z.string(), z.enum(['extracted', 'inferred', 'missing'])),
  }),
  warnings: z.array(z.string()),
})

export interface ParseResult {
  readonly snapshot: Partial<{
    readonly ef: number
    readonly nyhaClass: 1 | 2 | 3 | 4
    readonly sbp: number
    readonly hr: number
    readonly vitalsDate: string
    readonly egfr: number
    readonly potassium: number
    readonly labsDate: string
    readonly bnp: number
    readonly dmType: 'none' | 'type1' | 'type2'
    readonly medications: ReadonlyArray<Medication>
  }> | null
  readonly confidence: {
    readonly overall: 'high' | 'medium' | 'low'
    readonly fields: Readonly<Record<string, 'extracted' | 'inferred' | 'missing'>>
  }
  readonly warnings: ReadonlyArray<string>
  readonly parseErrors: ReadonlyArray<string>
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim()
  const fencePattern = /^```(?:json)?\s*\n([\s\S]*?)\n\s*```$/
  const match = fencePattern.exec(trimmed)
  return match ? match[1] : trimmed
}

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value
}

const DEFAULT_CONFIDENCE: ParseResult['confidence'] = {
  overall: 'low',
  fields: {},
}

export function parseVisionResponse(rawText: string): ParseResult {
  const stripped = stripCodeFences(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(stripped)
  } catch {
    return {
      snapshot: null,
      confidence: DEFAULT_CONFIDENCE,
      warnings: [],
      parseErrors: ['Failed to parse JSON from response'],
    }
  }

  const validation = visionResponseSchema.safeParse(parsed)

  if (!validation.success) {
    const errors = validation.error.issues.map(issue => {
      const path = issue.path.join('.')
      return `${path}: ${issue.message}`
    })
    return {
      snapshot: null,
      confidence: DEFAULT_CONFIDENCE,
      warnings: [],
      parseErrors: errors,
    }
  }

  const data = validation.data

  const filteredWarnings: string[] = [...data.warnings]
  const medications: ReadonlyArray<Medication> = data.medications
    .map(med => ({ ...med, pillar: normalizePillar(med.pillar) }))
    .filter(med => {
      const validPillar = (VALID_PILLARS as readonly string[]).includes(med.pillar)
      const validDoseTier = (VALID_DOSE_TIERS as readonly string[]).includes(med.doseTier)
      if (!validPillar) {
        filteredWarnings.push(`Unknown pillar "${med.pillar}" for medication "${med.name}" — filtered out`)
      }
      if (validPillar && !validDoseTier) {
        filteredWarnings.push(`Invalid dose tier "${med.doseTier}" for medication "${med.name}" — filtered out`)
      }
      return validPillar && validDoseTier
    })
    .map(med => ({
      pillar: med.pillar as Medication['pillar'],
      name: med.name,
      doseTier: med.doseTier as Medication['doseTier'],
    }))

  const snapshot: ParseResult['snapshot'] = {
    ...(nullToUndefined(data.ef) !== undefined ? { ef: data.ef! } : {}),
    ...(nullToUndefined(data.nyhaClass) !== undefined ? { nyhaClass: data.nyhaClass! } : {}),
    ...(nullToUndefined(data.sbp) !== undefined ? { sbp: data.sbp! } : {}),
    ...(nullToUndefined(data.hr) !== undefined ? { hr: data.hr! } : {}),
    ...(nullToUndefined(data.vitalsDate) !== undefined ? { vitalsDate: data.vitalsDate! } : {}),
    ...(nullToUndefined(data.egfr) !== undefined ? { egfr: data.egfr! } : {}),
    ...(nullToUndefined(data.potassium) !== undefined ? { potassium: data.potassium! } : {}),
    ...(nullToUndefined(data.labsDate) !== undefined ? { labsDate: data.labsDate! } : {}),
    ...(nullToUndefined(data.bnp) !== undefined ? { bnp: data.bnp! } : {}),
    ...(nullToUndefined(data.dmType) !== undefined ? { dmType: data.dmType! } : {}),
    medications,
  }

  return {
    snapshot,
    confidence: {
      overall: data.confidence.overall,
      fields: data.confidence.fields,
    },
    warnings: filteredWarnings,
    parseErrors: [],
  }
}
