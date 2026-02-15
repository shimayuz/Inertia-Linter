import { describe, it, expect } from 'vitest'
import { TARGET_DOSES } from '../target-doses'
import { PILLARS } from '../../types/pillar'

describe('TARGET_DOSES data integrity', () => {
  it('has entries for all 4 pillars', () => {
    expect(TARGET_DOSES.ARNI_ACEi_ARB.length).toBeGreaterThanOrEqual(1)
    expect(TARGET_DOSES.BETA_BLOCKER.length).toBeGreaterThanOrEqual(1)
    expect(TARGET_DOSES.MRA.length).toBeGreaterThanOrEqual(1)
    expect(TARGET_DOSES.SGLT2i.length).toBeGreaterThanOrEqual(1)
  })

  it('all entries have required fields', () => {
    for (const pillar of Object.values(PILLARS)) {
      for (const drug of TARGET_DOSES[pillar]) {
        expect(drug.drugName).toBeTruthy()
        expect(drug.genericName).toBeTruthy()
        expect(drug.pillar).toBe(pillar)
        expect(drug.targetDose).toBeTruthy()
        expect(drug.doi).toBeTruthy()
        expect(drug.guidelineSource).toBeTruthy()
        expect(drug.steps.length).toBeGreaterThanOrEqual(1)
        expect(drug.monitoringPerStep.length).toBeGreaterThanOrEqual(1)
        expect(drug.titrationInterval).toBeTruthy()
      }
    }
  })

  it('all steps have tier and label', () => {
    for (const pillar of Object.values(PILLARS)) {
      for (const drug of TARGET_DOSES[pillar]) {
        for (const step of drug.steps) {
          expect(step.tier).toBeTruthy()
          expect(step.label).toBeTruthy()
        }
      }
    }
  })

  it('SGLT2i drugs have note about no titration', () => {
    for (const drug of TARGET_DOSES.SGLT2i) {
      const hasNoTitrationNote = drug.steps.some(
        (step) => step.note && step.note.toLowerCase().includes('no titration'),
      )
      expect(hasNoTitrationNote).toBe(true)
    }
  })

  it('each drug has matching monitoringPerStep count to steps', () => {
    for (const pillar of Object.values(PILLARS)) {
      for (const drug of TARGET_DOSES[pillar]) {
        expect(drug.monitoringPerStep.length).toBe(drug.steps.length)
      }
    }
  })

  it('last step of each multi-step drug is HIGH tier', () => {
    for (const pillar of Object.values(PILLARS)) {
      for (const drug of TARGET_DOSES[pillar]) {
        if (drug.steps.length > 1) {
          const lastStep = drug.steps[drug.steps.length - 1]
          expect(lastStep.tier).toBe('HIGH')
        }
      }
    }
  })

  it('ARNI_ACEi_ARB pillar includes key drugs', () => {
    const names = TARGET_DOSES.ARNI_ACEi_ARB.map((d) => d.genericName)
    expect(names).toContain('Sacubitril/Valsartan')
    expect(names).toContain('Enalapril')
    expect(names).toContain('Lisinopril')
    expect(names).toContain('Losartan')
    expect(names).toContain('Valsartan')
    expect(names).toContain('Candesartan')
  })

  it('BETA_BLOCKER pillar includes key drugs', () => {
    const names = TARGET_DOSES.BETA_BLOCKER.map((d) => d.genericName)
    expect(names).toContain('Carvedilol')
    expect(names).toContain('Metoprolol Succinate')
    expect(names).toContain('Bisoprolol')
  })

  it('MRA pillar includes key drugs', () => {
    const names = TARGET_DOSES.MRA.map((d) => d.genericName)
    expect(names).toContain('Spironolactone')
    expect(names).toContain('Eplerenone')
  })

  it('SGLT2i pillar includes key drugs', () => {
    const names = TARGET_DOSES.SGLT2i.map((d) => d.genericName)
    expect(names).toContain('Dapagliflozin')
    expect(names).toContain('Empagliflozin')
  })
})
