import type { Pillar, BlockerCode } from '../types'
import type { BarrierInfo } from '../types/inertia-buster'
import { SGLT2I_BARRIERS } from '../data/inertia-buster-sglt2i'
import { ARNI_BARRIERS } from '../data/inertia-buster-arni'
import { BB_BARRIERS } from '../data/inertia-buster-bb'
import { MRA_BARRIERS } from '../data/inertia-buster-mra'

const ALL_BARRIERS: ReadonlyArray<BarrierInfo> = [
  ...SGLT2I_BARRIERS,
  ...ARNI_BARRIERS,
  ...BB_BARRIERS,
  ...MRA_BARRIERS,
]

export function getInertiaInfo(
  pillar: Pillar,
  blockerCodes: ReadonlyArray<BlockerCode>,
): ReadonlyArray<BarrierInfo> {
  if (blockerCodes.length === 0) {
    return []
  }

  return ALL_BARRIERS.filter(
    (barrier) =>
      barrier.pillar === pillar && blockerCodes.includes(barrier.blockerCode),
  )
}
