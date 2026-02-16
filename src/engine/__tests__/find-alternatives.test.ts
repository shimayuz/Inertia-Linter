import { describe, it, expect } from 'vitest'
import { findAlternatives, findAssistancePrograms } from '../find-alternatives'

describe('findAlternatives', () => {
  it('returns ACEi/ARB alternatives for ARNI pillar', () => {
    const result = findAlternatives('ARNI_ACEi_ARB', 'Entresto', 'PA_DENIED')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((a) => a.pillar === 'ARNI_ACEi_ARB')).toBe(true)
  })

  it('filters out current drug from alternatives', () => {
    const result = findAlternatives('ARNI_ACEi_ARB', 'Enalapril', 'PA_DENIED')
    expect(result.every((a) => a.drugName !== 'Enalapril')).toBe(true)
  })

  it('prioritizes generics first', () => {
    const result = findAlternatives('ARNI_ACEi_ARB', 'Entresto', 'PA_DENIED')
    const firstGenericIdx = result.findIndex((a) => a.isGeneric)
    const firstBrandIdx = result.findIndex((a) => !a.isGeneric)
    if (firstBrandIdx >= 0 && firstGenericIdx >= 0) {
      expect(firstGenericIdx).toBeLessThan(firstBrandIdx)
    }
  })

  it('returns MRA alternatives including spironolactone', () => {
    const result = findAlternatives('MRA', 'Eplerenone', 'COPAY_PROHIBITIVE')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((a) => a.drugName === 'Spironolactone')).toBe(true)
  })

  it('spironolactone is marked as $4 generic', () => {
    const result = findAlternatives('MRA', 'Eplerenone', 'COPAY_PROHIBITIVE')
    const spiro = result.find((a) => a.drugName === 'Spironolactone')
    expect(spiro).toBeDefined()
    expect(spiro?.isGeneric).toBe(true)
    expect(spiro?.estimatedMonthlyCost).toBe('$4')
  })

  it('returns SGLT2i alternatives', () => {
    const result = findAlternatives('SGLT2i', 'Dapagliflozin', 'FORMULARY_EXCLUDED')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((a) => a.drugName === 'Empagliflozin')).toBe(true)
  })

  it('returns empty array for BETA_BLOCKER (no alternatives defined)', () => {
    const result = findAlternatives('BETA_BLOCKER', 'Carvedilol', 'COST_BARRIER')
    expect(result).toHaveLength(0)
  })

  it('all alternatives have required fields', () => {
    const result = findAlternatives('ARNI_ACEi_ARB', 'Entresto', 'PA_DENIED')
    for (const alt of result) {
      expect(alt.drugName).toBeTruthy()
      expect(alt.genericName).toBeTruthy()
      expect(alt.estimatedMonthlyCost).toBeTruthy()
      expect(alt.guidelineSupport).toBeTruthy()
      expect(alt.switchConsiderations.length).toBeGreaterThan(0)
    }
  })
})

describe('findAssistancePrograms', () => {
  it('finds programs for Entresto', () => {
    const result = findAssistancePrograms('ARNI_ACEi_ARB', 'Entresto')
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((p) => p.programType === 'pap')).toBe(true)
  })

  it('finds programs for generic ACEi', () => {
    const result = findAssistancePrograms('ARNI_ACEi_ARB', 'Enalapril')
    expect(result.length).toBeGreaterThan(0)
  })

  it('finds programs for Dapagliflozin/Farxiga', () => {
    const result = findAssistancePrograms('SGLT2i', 'Farxiga')
    expect(result.length).toBeGreaterThan(0)
  })

  it('finds programs for Spironolactone', () => {
    const result = findAssistancePrograms('MRA', 'Spironolactone')
    expect(result.length).toBeGreaterThan(0)
  })

  it('all programs have required fields', () => {
    const result = findAssistancePrograms('ARNI_ACEi_ARB', 'Entresto')
    for (const program of result) {
      expect(program.id).toBeTruthy()
      expect(program.programName).toBeTruthy()
      expect(program.drugsCovered.length).toBeGreaterThan(0)
      expect(program.eligibilityCriteria.length).toBeGreaterThan(0)
      expect(program.estimatedSavings).toBeTruthy()
    }
  })
})
