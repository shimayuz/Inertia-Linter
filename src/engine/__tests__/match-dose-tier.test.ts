import { describe, it, expect } from 'vitest'
import { getDoseTierPoints } from '../match-dose-tier.ts'

describe('getDoseTierPoints', () => {
  it('returns 0 for NOT_PRESCRIBED', () => {
    expect(getDoseTierPoints('NOT_PRESCRIBED')).toBe(0)
  })

  it('returns 8 for LOW', () => {
    expect(getDoseTierPoints('LOW')).toBe(8)
  })

  it('returns 16 for MEDIUM', () => {
    expect(getDoseTierPoints('MEDIUM')).toBe(16)
  })

  it('returns 25 for HIGH', () => {
    expect(getDoseTierPoints('HIGH')).toBe(25)
  })
})
