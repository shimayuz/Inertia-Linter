import { describe, it, expect } from 'vitest'
import {
  advanceResolution,
  calculateResolutionProgress,
  createResolutionRecord,
  isResolutionActive,
} from '../resolution-tracker'
import type { ResolutionRecord, ResolutionEvent } from '../../types/resolution'

function makeRecord(overrides: Partial<ResolutionRecord> = {}): ResolutionRecord {
  return {
    id: 'res-test-1',
    pathwayId: 'ARNI_ACEi_ARB-step_therapy-bridge',
    pathwayType: 'step_therapy_start',
    blockerCode: 'STEP_THERAPY_REQUIRED',
    pillar: 'ARNI_ACEi_ARB',
    status: 'not_started',
    startedAt: '2026-02-14T00:00:00Z',
    updatedAt: '2026-02-14T00:00:00Z',
    stepProgress: [
      { stepId: 's1', status: 'pending', autoCompleted: false },
      { stepId: 's2', status: 'pending', autoCompleted: false },
      { stepId: 's3', status: 'pending', autoCompleted: false },
    ],
    generatedDocuments: [],
    ...overrides,
  }
}

function makeEvent(type: ResolutionEvent['type'], stepId?: string): ResolutionEvent {
  return {
    type,
    stepId,
    timestamp: '2026-02-14T01:00:00Z',
  }
}

describe('advanceResolution', () => {
  it('transitions from not_started to auto_preparing on start', () => {
    const record = makeRecord()
    const result = advanceResolution(record, makeEvent('start'))
    expect(result.status).toBe('auto_preparing')
    expect(result.updatedAt).toBe('2026-02-14T01:00:00Z')
  })

  it('transitions from auto_preparing to clinician_review', () => {
    const record = makeRecord({ status: 'auto_preparing' })
    const result = advanceResolution(record, makeEvent('auto_step_complete', 's1'))
    expect(result.status).toBe('clinician_review')
  })

  it('marks step as completed on auto_step_complete', () => {
    const record = makeRecord({ status: 'auto_preparing' })
    const result = advanceResolution(record, makeEvent('auto_step_complete', 's1'))
    const step = result.stepProgress.find((s) => s.stepId === 's1')
    expect(step?.status).toBe('completed')
    expect(step?.autoCompleted).toBe(true)
  })

  it('transitions from clinician_review to submitted on approve', () => {
    const record = makeRecord({ status: 'clinician_review' })
    const result = advanceResolution(record, makeEvent('clinician_approve', 's2'))
    expect(result.status).toBe('submitted')
  })

  it('transitions from clinician_review to abandoned on reject', () => {
    const record = makeRecord({ status: 'clinician_review' })
    const result = advanceResolution(record, makeEvent('clinician_reject'))
    expect(result.status).toBe('abandoned')
  })

  it('does not mutate the original record', () => {
    const record = makeRecord()
    const result = advanceResolution(record, makeEvent('start'))
    expect(record.status).toBe('not_started')
    expect(result.status).toBe('auto_preparing')
    expect(record).not.toBe(result)
  })

  it('sets completedAt when reaching completed status', () => {
    const record = makeRecord({ status: 'approved' })
    const result = advanceResolution(record, makeEvent('complete'))
    expect(result.status).toBe('completed')
    expect(result.completedAt).toBe('2026-02-14T01:00:00Z')
  })

  it('ignores invalid transitions', () => {
    const record = makeRecord({ status: 'completed' })
    const result = advanceResolution(record, makeEvent('start'))
    expect(result.status).toBe('completed')
  })

  it('transitions through full lifecycle', () => {
    let record = makeRecord()
    record = advanceResolution(record, makeEvent('start'))
    expect(record.status).toBe('auto_preparing')

    record = advanceResolution(record, makeEvent('auto_step_complete', 's1'))
    expect(record.status).toBe('clinician_review')

    record = advanceResolution(record, makeEvent('clinician_approve', 's2'))
    expect(record.status).toBe('submitted')

    record = advanceResolution(record, makeEvent('external_approve'))
    expect(record.status).toBe('approved')

    record = advanceResolution(record, makeEvent('complete'))
    expect(record.status).toBe('completed')
    expect(record.completedAt).toBeTruthy()
  })
})

describe('calculateResolutionProgress', () => {
  it('returns 0% for all pending steps', () => {
    const record = makeRecord()
    const progress = calculateResolutionProgress(record)
    expect(progress.completedSteps).toBe(0)
    expect(progress.totalSteps).toBe(3)
    expect(progress.percentComplete).toBe(0)
  })

  it('returns correct percentage for partial completion', () => {
    const record = makeRecord({
      stepProgress: [
        { stepId: 's1', status: 'completed', autoCompleted: true, completedAt: '2026-02-14T01:00:00Z' },
        { stepId: 's2', status: 'pending', autoCompleted: false },
        { stepId: 's3', status: 'pending', autoCompleted: false },
      ],
    })
    const progress = calculateResolutionProgress(record)
    expect(progress.completedSteps).toBe(1)
    expect(progress.totalSteps).toBe(3)
    expect(progress.percentComplete).toBe(33)
  })

  it('returns 100% for all completed steps', () => {
    const record = makeRecord({
      stepProgress: [
        { stepId: 's1', status: 'completed', autoCompleted: true },
        { stepId: 's2', status: 'completed', autoCompleted: false },
        { stepId: 's3', status: 'completed', autoCompleted: true },
      ],
    })
    const progress = calculateResolutionProgress(record)
    expect(progress.completedSteps).toBe(3)
    expect(progress.percentComplete).toBe(100)
  })

  it('counts skipped steps as progress', () => {
    const record = makeRecord({
      stepProgress: [
        { stepId: 's1', status: 'completed', autoCompleted: true },
        { stepId: 's2', status: 'skipped', autoCompleted: false },
        { stepId: 's3', status: 'pending', autoCompleted: false },
      ],
    })
    const progress = calculateResolutionProgress(record)
    expect(progress.completedSteps).toBe(2)
    expect(progress.percentComplete).toBe(67)
  })

  it('handles empty step progress', () => {
    const record = makeRecord({ stepProgress: [] })
    const progress = calculateResolutionProgress(record)
    expect(progress.completedSteps).toBe(0)
    expect(progress.totalSteps).toBe(0)
    expect(progress.percentComplete).toBe(0)
  })
})

describe('createResolutionRecord', () => {
  it('creates record with not_started status', () => {
    const record = createResolutionRecord(
      'test-pathway', 'step_therapy_start', 'STEP_THERAPY_REQUIRED', 'ARNI_ACEi_ARB', ['s1', 's2'],
    )
    expect(record.status).toBe('not_started')
    expect(record.pathwayId).toBe('test-pathway')
    expect(record.stepProgress).toHaveLength(2)
    expect(record.stepProgress[0].stepId).toBe('s1')
    expect(record.stepProgress[0].status).toBe('pending')
  })

  it('creates record with empty generated documents', () => {
    const record = createResolutionRecord(
      'test', 'generic_switch', 'COPAY_PROHIBITIVE', 'MRA', ['s1'],
    )
    expect(record.generatedDocuments).toHaveLength(0)
  })
})

describe('isResolutionActive', () => {
  it('returns true for active statuses', () => {
    expect(isResolutionActive(makeRecord({ status: 'not_started' }))).toBe(true)
    expect(isResolutionActive(makeRecord({ status: 'auto_preparing' }))).toBe(true)
    expect(isResolutionActive(makeRecord({ status: 'clinician_review' }))).toBe(true)
    expect(isResolutionActive(makeRecord({ status: 'submitted' }))).toBe(true)
    expect(isResolutionActive(makeRecord({ status: 'in_progress' }))).toBe(true)
    expect(isResolutionActive(makeRecord({ status: 'approved' }))).toBe(true)
  })

  it('returns false for terminal statuses', () => {
    expect(isResolutionActive(makeRecord({ status: 'completed' }))).toBe(false)
    expect(isResolutionActive(makeRecord({ status: 'abandoned' }))).toBe(false)
  })
})
