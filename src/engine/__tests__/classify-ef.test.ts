import { describe, it, expect } from 'vitest'
import { classifyEF } from '../classify-ef'

describe('classifyEF', () => {
  it('returns HFrEF for EF=30', () => {
    expect(classifyEF(30)).toBe('HFrEF')
  })

  it('returns HFrEF for EF=40 (boundary)', () => {
    expect(classifyEF(40)).toBe('HFrEF')
  })

  it('returns HFmrEF for EF=41 (boundary)', () => {
    expect(classifyEF(41)).toBe('HFmrEF')
  })

  it('returns HFmrEF for EF=45', () => {
    expect(classifyEF(45)).toBe('HFmrEF')
  })

  it('returns HFmrEF for EF=49 (boundary)', () => {
    expect(classifyEF(49)).toBe('HFmrEF')
  })

  it('returns HFpEF for EF=50 (boundary)', () => {
    expect(classifyEF(50)).toBe('HFpEF')
  })

  it('returns HFpEF for EF=58', () => {
    expect(classifyEF(58)).toBe('HFpEF')
  })

  it('returns HFrEF for very low EF=10', () => {
    expect(classifyEF(10)).toBe('HFrEF')
  })

  it('returns HFpEF for high EF=80', () => {
    expect(classifyEF(80)).toBe('HFpEF')
  })
})
