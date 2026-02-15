import type { Pillar } from './pillar.ts'
import type { PatientSnapshot } from './patient.ts'
import type { AuditResult } from './audit.ts'

export interface ClinicalEvent {
  readonly date: string
  readonly type: 'med_start' | 'med_change' | 'med_stop' | 'lab' | 'vitals' | 'hospitalization' | 'visit'
  readonly description: string
  readonly pillar?: Pillar
}

export interface TimelineEntry {
  readonly date: string
  readonly snapshot: PatientSnapshot
  readonly auditResult: AuditResult
  readonly events: ReadonlyArray<ClinicalEvent>
}

export interface PatientTimeline {
  readonly patientId: string
  readonly label: string
  readonly entries: ReadonlyArray<TimelineEntry>
}
