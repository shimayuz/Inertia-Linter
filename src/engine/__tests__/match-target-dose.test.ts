import { describe, it, expect } from 'vitest'
import { matchTargetDose, getCurrentStepIndex } from '../match-target-dose'
import type { DrugTargetDose } from '../../types/target-dose'

describe('matchTargetDose', () => {
  it('matches Carvedilol by generic name with dose suffix', () => {
    const result = matchTargetDose('BETA_BLOCKER', 'Carvedilol 6.25mg')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Carvedilol')
  })

  it('matches sacubitril/valsartan by generic name (case-insensitive)', () => {
    const result = matchTargetDose('ARNI_ACEi_ARB', 'sacubitril/valsartan')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Sacubitril/Valsartan')
  })

  it('matches Entresto by brand name', () => {
    const result = matchTargetDose('ARNI_ACEi_ARB', 'Entresto')
    expect(result).not.toBeNull()
    expect(result!.brandName).toBe('Entresto')
    expect(result!.genericName).toBe('Sacubitril/Valsartan')
  })

  it('matches Dapagliflozin by generic name with dose suffix', () => {
    const result = matchTargetDose('SGLT2i', 'Dapagliflozin 10mg')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Dapagliflozin')
  })

  it('returns null for unknown drug', () => {
    const result = matchTargetDose('BETA_BLOCKER', 'unknown drug')
    expect(result).toBeNull()
  })

  it('returns null when drug exists but wrong pillar', () => {
    const result = matchTargetDose('MRA', 'Carvedilol')
    expect(result).toBeNull()
  })

  it('matches case-insensitively', () => {
    const result = matchTargetDose('MRA', 'SPIRONOLACTONE')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Spironolactone')
  })

  it('matches Farxiga by brand name', () => {
    const result = matchTargetDose('SGLT2i', 'Farxiga')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Dapagliflozin')
  })

  it('matches Jardiance by brand name', () => {
    const result = matchTargetDose('SGLT2i', 'Jardiance')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Empagliflozin')
  })

  it('matches Metoprolol Succinate by generic name', () => {
    const result = matchTargetDose('BETA_BLOCKER', 'metoprolol succinate 50mg')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Metoprolol Succinate')
  })

  it('matches partial drug name substring', () => {
    const result = matchTargetDose('ARNI_ACEi_ARB', 'Enalapril 10mg BID')
    expect(result).not.toBeNull()
    expect(result!.genericName).toBe('Enalapril')
  })
})

describe('getCurrentStepIndex', () => {
  const mockDrug: DrugTargetDose = {
    drugName: 'Carvedilol',
    genericName: 'Carvedilol',
    pillar: 'BETA_BLOCKER',
    targetDose: '25mg BID',
    steps: [
      { label: '3.125mg BID', tier: 'LOW' },
      { label: '6.25mg BID', tier: 'LOW' },
      { label: '12.5mg BID', tier: 'MEDIUM' },
      { label: '25mg BID', tier: 'HIGH' },
    ],
    monitoringPerStep: [
      'BP, HR after 2 weeks',
      'BP, HR after 2 weeks',
      'BP, HR after 2 weeks',
      'BP, HR after 2 weeks',
    ],
    titrationInterval: 'Every 2 weeks',
    guidelineSource: 'AHA/ACC/HFSA 2022',
    doi: '10.1161/CIR.0000000000001063',
  }

  it('returns first matching index for LOW tier', () => {
    const index = getCurrentStepIndex(mockDrug, 'LOW')
    expect(index).toBe(0)
  })

  it('returns first matching index for MEDIUM tier', () => {
    const index = getCurrentStepIndex(mockDrug, 'MEDIUM')
    expect(index).toBe(2)
  })

  it('returns first matching index for HIGH tier', () => {
    const index = getCurrentStepIndex(mockDrug, 'HIGH')
    expect(index).toBe(3)
  })

  it('returns -1 for NOT_PRESCRIBED tier', () => {
    const index = getCurrentStepIndex(mockDrug, 'NOT_PRESCRIBED')
    expect(index).toBe(-1)
  })
})
