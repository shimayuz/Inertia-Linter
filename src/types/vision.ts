import type { PatientSnapshot } from './patient.ts'

export interface ImageData {
  readonly base64: string
  readonly mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
  readonly fileName: string
  readonly fileSizeBytes: number
}

export interface ExtractionConfidence {
  readonly overall: 'high' | 'medium' | 'low'
  readonly fields: Readonly<Record<string, 'extracted' | 'inferred' | 'missing'>>
}

export interface ExtractionResult {
  readonly snapshot: Partial<PatientSnapshot> | null
  readonly rawResponse: string | null
  readonly confidence: ExtractionConfidence
  readonly warnings: ReadonlyArray<string>
  readonly parseErrors: ReadonlyArray<string>
}
