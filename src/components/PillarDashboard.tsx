import type { Pillar } from '../types/pillar'
import type { PillarResult } from '../types/audit'
import { PillarCard } from './PillarCard'

interface PillarDashboardProps {
  readonly results: ReadonlyArray<PillarResult>
  readonly selectedPillar?: Pillar | null
  readonly onSelectPillar?: (pillar: Pillar) => void
}

export function PillarDashboard({
  results,
  selectedPillar = null,
  onSelectPillar,
}: PillarDashboardProps) {
  return (
    <section aria-label="GDMT Pillar Status">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {results.map((result) => (
          <PillarCard
            key={result.pillar}
            result={result}
            isSelected={selectedPillar === result.pillar}
            onClick={onSelectPillar ? () => onSelectPillar(result.pillar) : undefined}
          />
        ))}
      </div>
    </section>
  )
}
