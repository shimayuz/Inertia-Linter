import { describe, it, expect } from 'vitest'
import { parseCitations } from '../parse-citations'

describe('parseCitations', () => {
  it('parses a single guideline citation', () => {
    const raw = 'Per [guideline:AHA2022], ARNI is recommended.'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(1)
    expect(result.citations[0]).toEqual({
      type: 'guideline',
      id: 'AHA2022',
      label: 'AHA 2022',
    })
    expect(result.text).toBe('Per AHA 2022\u00B9, ARNI is recommended.')
  })

  it('parses multiple citations of different types', () => {
    const raw =
      'Based on [guideline:ESC2021] and [trial:PARADIGM-HF], the patient eGFR [patient:egfr] supports initiation.'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(3)
    expect(result.citations[0]).toEqual({
      type: 'guideline',
      id: 'ESC2021',
      label: 'ESC 2021',
    })
    expect(result.citations[1]).toEqual({
      type: 'trial',
      id: 'PARADIGM-HF',
      label: 'PARADIGM-HF',
    })
    expect(result.citations[2]).toEqual({
      type: 'patient',
      id: 'egfr',
      label: 'eGFR',
    })
    expect(result.text).toBe(
      'Based on ESC 2021\u00B9 and PARADIGM-HF\u00B2, the patient eGFR eGFR\u00B3 supports initiation.'
    )
  })

  it('returns text unchanged when there are no citations', () => {
    const raw = 'No citations in this text.'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(0)
    expect(result.text).toBe('No citations in this text.')
  })

  it('deduplicates repeated citations', () => {
    const raw =
      '[guideline:AHA2022] recommends ARNI. See [guideline:AHA2022] for details.'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(1)
    expect(result.citations[0]).toEqual({
      type: 'guideline',
      id: 'AHA2022',
      label: 'AHA 2022',
    })
    expect(result.text).toBe(
      'AHA 2022\u00B9 recommends ARNI. See AHA 2022\u00B9 for details.'
    )
  })

  it('ignores malformed markers', () => {
    const raw = 'This has [broken marker and [guideline:AHA2022] valid one.'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(1)
    expect(result.citations[0].id).toBe('AHA2022')
    expect(result.text).toContain('[broken marker')
    expect(result.text).toContain('AHA 2022\u00B9')
  })

  it('assigns numbered superscripts in order of first appearance', () => {
    const raw =
      '[trial:DAPA-HF] showed benefit. [guideline:AHA2022] agrees. [trial:DAPA-HF] confirmed.'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(2)
    expect(result.text).toBe(
      'DAPA-HF\u00B9 showed benefit. AHA 2022\u00B2 agrees. DAPA-HF\u00B9 confirmed.'
    )
  })

  it('handles patient citation with uppercase field', () => {
    const raw = 'SBP is [patient:sbp] and eGFR is [patient:egfr].'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(2)
    expect(result.citations[0]).toEqual({
      type: 'patient',
      id: 'sbp',
      label: 'SBP',
    })
    expect(result.citations[1]).toEqual({
      type: 'patient',
      id: 'egfr',
      label: 'eGFR',
    })
  })

  it('handles guideline IDs with numbers correctly in label', () => {
    const raw = '[guideline:ACC_ECDP2024] provides guidance.'
    const result = parseCitations(raw)

    expect(result.citations).toHaveLength(1)
    expect(result.citations[0]).toEqual({
      type: 'guideline',
      id: 'ACC_ECDP2024',
      label: 'ACC ECDP 2024',
    })
  })

  it('returns readonly arrays', () => {
    const raw = '[guideline:AHA2022] text'
    const result = parseCitations(raw)

    expect(Array.isArray(result.citations)).toBe(true)
    expect(result.citations).toHaveLength(1)
  })
})
