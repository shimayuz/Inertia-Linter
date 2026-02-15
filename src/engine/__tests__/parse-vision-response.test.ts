import { describe, it, expect } from 'vitest'
import { parseVisionResponse } from '../parse-vision-response'

const validComplete = JSON.stringify({
  ef: 30,
  nyhaClass: 3,
  sbp: 110,
  hr: 72,
  vitalsDate: '2026-01-15',
  egfr: 55,
  potassium: 4.2,
  labsDate: '2026-01-14',
  bnp: 850,
  dmType: 'type2',
  medications: [
    { pillar: 'ARNI_ACEi_ARB', name: 'sacubitril/valsartan', doseTier: 'MEDIUM' },
    { pillar: 'BETA_BLOCKER', name: 'carvedilol', doseTier: 'LOW' },
    { pillar: 'MRA', name: 'spironolactone', doseTier: 'LOW' },
    { pillar: 'SGLT2i', name: 'dapagliflozin', doseTier: 'HIGH' },
  ],
  confidence: {
    overall: 'high',
    fields: {
      ef: 'extracted',
      nyhaClass: 'extracted',
      sbp: 'extracted',
      hr: 'extracted',
      vitalsDate: 'extracted',
      egfr: 'extracted',
      potassium: 'extracted',
      labsDate: 'extracted',
      bnp: 'extracted',
      dmType: 'inferred',
    },
  },
  warnings: ['dmType inferred from medication list'],
})

describe('parseVisionResponse', () => {
  it('parses valid complete JSON with all fields', () => {
    const result = parseVisionResponse(validComplete)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.ef).toBe(30)
    expect(result.snapshot?.nyhaClass).toBe(3)
    expect(result.snapshot?.sbp).toBe(110)
    expect(result.snapshot?.hr).toBe(72)
    expect(result.snapshot?.vitalsDate).toBe('2026-01-15')
    expect(result.snapshot?.egfr).toBe(55)
    expect(result.snapshot?.potassium).toBe(4.2)
    expect(result.snapshot?.labsDate).toBe('2026-01-14')
    expect(result.snapshot?.bnp).toBe(850)
    expect(result.snapshot?.dmType).toBe('type2')
    expect(result.snapshot?.medications).toHaveLength(4)
    expect(result.confidence.overall).toBe('high')
    expect(result.parseErrors).toHaveLength(0)
  })

  it('parses JSON wrapped in ```json code fences', () => {
    const wrapped = '```json\n' + validComplete + '\n```'
    const result = parseVisionResponse(wrapped)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.ef).toBe(30)
    expect(result.parseErrors).toHaveLength(0)
  })

  it('parses JSON wrapped in ``` code fences without language tag', () => {
    const wrapped = '```\n' + validComplete + '\n```'
    const result = parseVisionResponse(wrapped)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.ef).toBe(30)
    expect(result.parseErrors).toHaveLength(0)
  })

  it('handles partial data with null fields', () => {
    const partial = JSON.stringify({
      ef: 45,
      nyhaClass: 2,
      sbp: null,
      hr: null,
      vitalsDate: null,
      egfr: null,
      potassium: null,
      labsDate: null,
      bnp: null,
      dmType: null,
      medications: [
        { pillar: 'ARNI_ACEi_ARB', name: '', doseTier: 'NOT_PRESCRIBED' },
        { pillar: 'BETA_BLOCKER', name: '', doseTier: 'NOT_PRESCRIBED' },
        { pillar: 'MRA', name: '', doseTier: 'NOT_PRESCRIBED' },
        { pillar: 'SGLT2i', name: '', doseTier: 'NOT_PRESCRIBED' },
      ],
      confidence: {
        overall: 'low',
        fields: { ef: 'extracted', nyhaClass: 'inferred' },
      },
      warnings: ['Most fields could not be determined'],
    })

    const result = parseVisionResponse(partial)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.ef).toBe(45)
    expect(result.snapshot?.nyhaClass).toBe(2)
    expect(result.snapshot?.sbp).toBeUndefined()
    expect(result.snapshot?.hr).toBeUndefined()
    expect(result.snapshot?.egfr).toBeUndefined()
    expect(result.snapshot?.potassium).toBeUndefined()
    expect(result.snapshot?.labsDate).toBeUndefined()
    expect(result.snapshot?.bnp).toBeUndefined()
    expect(result.snapshot?.dmType).toBeUndefined()
    expect(result.confidence.overall).toBe('low')
    expect(result.parseErrors).toHaveLength(0)
  })

  it('handles all fields null with low confidence', () => {
    const allNull = JSON.stringify({
      ef: null,
      nyhaClass: null,
      sbp: null,
      hr: null,
      vitalsDate: null,
      egfr: null,
      potassium: null,
      labsDate: null,
      bnp: null,
      dmType: null,
      medications: [],
      confidence: { overall: 'low', fields: {} },
      warnings: ['Unable to extract any data from image'],
    })

    const result = parseVisionResponse(allNull)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.ef).toBeUndefined()
    expect(result.snapshot?.sbp).toBeUndefined()
    expect(result.snapshot?.hr).toBeUndefined()
    expect(result.confidence.overall).toBe('low')
    expect(result.parseErrors).toHaveLength(0)
  })

  it('returns null snapshot for completely invalid text', () => {
    const result = parseVisionResponse('This is not JSON at all, just random text.')

    expect(result.snapshot).toBeNull()
    expect(result.parseErrors.length).toBeGreaterThan(0)
    expect(result.confidence.overall).toBe('low')
  })

  it('returns null snapshot for broken JSON (missing closing brace)', () => {
    const broken = '{"ef": 30, "sbp": 120'
    const result = parseVisionResponse(broken)

    expect(result.snapshot).toBeNull()
    expect(result.parseErrors.length).toBeGreaterThan(0)
    expect(result.confidence.overall).toBe('low')
  })

  it('reports parseErrors for out-of-range values', () => {
    const outOfRange = JSON.stringify({
      ef: 150,
      nyhaClass: 2,
      sbp: -10,
      hr: 72,
      vitalsDate: '2026-01-15',
      medications: [],
      confidence: { overall: 'high', fields: {} },
      warnings: [],
    })

    const result = parseVisionResponse(outOfRange)

    expect(result.snapshot).toBeNull()
    expect(result.parseErrors.length).toBeGreaterThan(0)
    expect(result.parseErrors.some(e => e.includes('ef'))).toBe(true)
    expect(result.parseErrors.some(e => e.includes('sbp'))).toBe(true)
  })

  it('preserves valid medications with pillar classification', () => {
    const withMeds = JSON.stringify({
      ef: 30,
      nyhaClass: 3,
      sbp: 110,
      hr: 72,
      vitalsDate: '2026-01-15',
      medications: [
        { pillar: 'ARNI_ACEi_ARB', name: 'sacubitril/valsartan', doseTier: 'HIGH' },
        { pillar: 'BETA_BLOCKER', name: 'carvedilol', doseTier: 'LOW' },
        { pillar: 'MRA', name: 'spironolactone', doseTier: 'MEDIUM' },
        { pillar: 'SGLT2i', name: 'empagliflozin', doseTier: 'HIGH' },
      ],
      confidence: { overall: 'high', fields: {} },
      warnings: [],
    })

    const result = parseVisionResponse(withMeds)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.medications).toHaveLength(4)
    expect(result.snapshot?.medications?.[0]).toEqual({
      pillar: 'ARNI_ACEi_ARB',
      name: 'sacubitril/valsartan',
      doseTier: 'HIGH',
    })
    expect(result.snapshot?.medications?.[3]).toEqual({
      pillar: 'SGLT2i',
      name: 'empagliflozin',
      doseTier: 'HIGH',
    })
  })

  it('handles empty medications array', () => {
    const noMeds = JSON.stringify({
      ef: 55,
      nyhaClass: 2,
      sbp: 130,
      hr: 68,
      vitalsDate: '2026-01-15',
      medications: [],
      confidence: { overall: 'medium', fields: {} },
      warnings: ['No medications found in image'],
    })

    const result = parseVisionResponse(noMeds)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.medications).toEqual([])
    expect(result.parseErrors).toHaveLength(0)
  })

  it('preserves confidence metadata correctly', () => {
    const withConfidence = JSON.stringify({
      ef: 35,
      nyhaClass: 2,
      sbp: 115,
      hr: 70,
      vitalsDate: '2026-01-15',
      medications: [],
      confidence: {
        overall: 'medium',
        fields: {
          ef: 'extracted',
          nyhaClass: 'inferred',
          sbp: 'extracted',
          hr: 'missing',
        },
      },
      warnings: [],
    })

    const result = parseVisionResponse(withConfidence)

    expect(result.confidence.overall).toBe('medium')
    expect(result.confidence.fields).toEqual({
      ef: 'extracted',
      nyhaClass: 'inferred',
      sbp: 'extracted',
      hr: 'missing',
    })
  })

  it('preserves warnings array', () => {
    const withWarnings = JSON.stringify({
      ef: 40,
      nyhaClass: 3,
      sbp: 100,
      hr: 80,
      vitalsDate: '2026-01-15',
      medications: [],
      confidence: { overall: 'medium', fields: {} },
      warnings: [
        'Handwriting partially illegible',
        'Date format ambiguous',
        'Medication dose unclear',
      ],
    })

    const result = parseVisionResponse(withWarnings)

    expect(result.warnings).toHaveLength(3)
    expect(result.warnings).toContain('Handwriting partially illegible')
    expect(result.warnings).toContain('Date format ambiguous')
    expect(result.warnings).toContain('Medication dose unclear')
  })

  it('filters out medications with unknown pillar and adds warning', () => {
    const withUnknown = JSON.stringify({
      ef: 35,
      nyhaClass: 2,
      sbp: 120,
      hr: 68,
      vitalsDate: '2026-01-15',
      medications: [
        { pillar: 'ARNI_ACEi_ARB', name: 'sacubitril/valsartan', doseTier: 'HIGH' },
        { pillar: 'STATIN', name: 'atorvastatin', doseTier: 'HIGH' },
        { pillar: 'SGLT2i', name: 'dapagliflozin', doseTier: 'HIGH' },
        { pillar: 'DIURETIC', name: 'furosemide', doseTier: 'MEDIUM' },
      ],
      confidence: { overall: 'high', fields: {} },
      warnings: [],
    })

    const result = parseVisionResponse(withUnknown)

    expect(result.snapshot).not.toBeNull()
    expect(result.snapshot?.medications).toHaveLength(2)
    expect(result.snapshot?.medications?.[0]?.pillar).toBe('ARNI_ACEi_ARB')
    expect(result.snapshot?.medications?.[1]?.pillar).toBe('SGLT2i')
    expect(result.warnings.some(w => w.includes('STATIN'))).toBe(true)
    expect(result.warnings.some(w => w.includes('DIURETIC'))).toBe(true)
    expect(result.parseErrors).toHaveLength(0)
  })
})
