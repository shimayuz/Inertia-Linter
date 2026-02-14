import { describe, it, expect } from 'vitest'
import { getEGFRThreshold } from '../egfr-thresholds.ts'

describe('getEGFRThreshold', () => {
  describe('SGLT2i', () => {
    it('returns 20 for initiation', () => {
      expect(getEGFRThreshold('SGLT2i', true)).toBe(20)
    })

    it('returns 15 for continuation', () => {
      expect(getEGFRThreshold('SGLT2i', false)).toBe(15)
    })
  })

  describe('MRA', () => {
    it('returns 30 for initiation', () => {
      expect(getEGFRThreshold('MRA', true)).toBe(30)
    })

    it('returns 20 for continuation', () => {
      expect(getEGFRThreshold('MRA', false)).toBe(20)
    })
  })

  describe('ARNI_ACEi_ARB', () => {
    it('returns 20 for initiation', () => {
      expect(getEGFRThreshold('ARNI_ACEi_ARB', true)).toBe(20)
    })

    it('returns 15 for continuation', () => {
      expect(getEGFRThreshold('ARNI_ACEi_ARB', false)).toBe(15)
    })
  })

  describe('BETA_BLOCKER', () => {
    it('returns null for initiation (no eGFR threshold)', () => {
      expect(getEGFRThreshold('BETA_BLOCKER', true)).toBeNull()
    })

    it('returns null for continuation (no eGFR threshold)', () => {
      expect(getEGFRThreshold('BETA_BLOCKER', false)).toBeNull()
    })
  })
})
