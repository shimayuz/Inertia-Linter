export type PatientSource = 'demo' | 'fhir' | 'manual'

export interface AppointmentPatient {
  readonly id: string
  readonly name: string
  readonly age: number
  readonly gender: string
  readonly condition: string
  readonly source: PatientSource
  readonly appointmentTime?: string
}
