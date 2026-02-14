export interface GuidelinePosition {
  readonly source: 'AHA' | 'ESC' | 'ACC_ECDP'
  readonly class: string
  readonly loe: string
  readonly year: number
  readonly doi: string
  readonly note?: string
}

export interface GuidelineComparison {
  readonly topic: string
  readonly positions: ReadonlyArray<GuidelinePosition>
  readonly hasDifference: boolean
}
