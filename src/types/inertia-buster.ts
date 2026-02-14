import type { Pillar } from './pillar'
import type { BlockerCode } from './blocker'

export interface BarrierInfo {
  readonly blockerId: string
  readonly pillar: Pillar
  readonly blockerCode: BlockerCode
  readonly title: string
  readonly information: ReadonlyArray<string>
  readonly practicalOptions: ReadonlyArray<string>
  readonly whenNotTo: ReadonlyArray<string>
  readonly evidenceSource: string
  readonly disclaimer: string
}
