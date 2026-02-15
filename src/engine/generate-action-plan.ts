import type { AuditResult, PillarResult } from '../types/audit.ts'
import type { ActionItem, ActionCategory, ActionPriority } from '../types/action-plan.ts'
import type { BlockerCode } from '../types/blocker.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'
import { BLOCKER_UI_LABELS } from '../types/blocker.ts'
import { getInertiaInfo } from './get-inertia-info.ts'

const MAX_ACTIONS = 5

const PRIORITY_ORDER: Readonly<Record<ActionPriority, number>> = {
  high: 0,
  medium: 1,
  low: 2,
}

const LAB_BLOCKERS: ReadonlyArray<BlockerCode> = ['STALE_LABS', 'UNKNOWN_LABS']

function isRealBlocker(code: BlockerCode): boolean {
  return code !== 'CLINICAL_INERTIA'
}

function hasOnlyInertiaBlocker(blockers: ReadonlyArray<BlockerCode>): boolean {
  return blockers.length === 0 || blockers.every((b) => !isRealBlocker(b))
}

function extractEvidence(
  pillarResult: PillarResult,
): string {
  const barriers = getInertiaInfo(pillarResult.pillar, pillarResult.blockers)
  if (barriers.length > 0) {
    return barriers[0].evidenceSource
  }
  return ''
}

function extractCautions(
  pillarResult: PillarResult,
): ReadonlyArray<string> {
  const barriers = getInertiaInfo(pillarResult.pillar, pillarResult.blockers)
  if (barriers.length > 0) {
    return barriers[0].whenNotTo
  }
  return []
}

function buildActionForMissingNoBlocker(
  pillarResult: PillarResult,
): ActionItem {
  const pillarLabel = PILLAR_LABELS[pillarResult.pillar]
  return {
    id: `${pillarResult.pillar}-initiate`,
    pillar: pillarResult.pillar,
    category: 'initiate',
    priority: 'high',
    title: `${pillarLabel}: Consider initiating`,
    rationale: 'No identified contraindication. Guideline-directed therapy not yet started.',
    suggestedAction: `Consider initiating ${pillarLabel}`,
    evidence: extractEvidence(pillarResult),
    cautions: extractCautions(pillarResult),
  }
}

function buildActionForUnderdosed(
  pillarResult: PillarResult,
): ActionItem {
  const pillarLabel = PILLAR_LABELS[pillarResult.pillar]
  return {
    id: `${pillarResult.pillar}-uptitrate`,
    pillar: pillarResult.pillar,
    category: 'uptitrate',
    priority: 'medium',
    title: `${pillarLabel}: Uptitration opportunity`,
    rationale: 'Below target dose with no identified barrier to uptitration.',
    suggestedAction: 'Current dose is below target. Consider uptitration if tolerated.',
    evidence: extractEvidence(pillarResult),
    cautions: extractCautions(pillarResult),
  }
}

function buildActionForLabBlocker(
  pillarResult: PillarResult,
  blockerCode: BlockerCode,
): ActionItem {
  const pillarLabel = PILLAR_LABELS[pillarResult.pillar]
  const blockerLabel = BLOCKER_UI_LABELS[blockerCode]
  return {
    id: `${pillarResult.pillar}-order_labs`,
    pillar: pillarResult.pillar,
    category: 'order_labs',
    priority: 'high',
    title: `${pillarLabel}: ${blockerLabel}`,
    rationale: `${blockerLabel}. Updated lab values are needed to assess eligibility.`,
    suggestedAction: 'Order updated lab panel to reassess eligibility.',
    evidence: extractEvidence(pillarResult),
    cautions: extractCautions(pillarResult),
  }
}

function buildActionForRealBlocker(
  pillarResult: PillarResult,
  blockerCode: BlockerCode,
): ActionItem {
  const pillarLabel = PILLAR_LABELS[pillarResult.pillar]
  const blockerLabel = BLOCKER_UI_LABELS[blockerCode]
  return {
    id: `${pillarResult.pillar}-resolve_blocker`,
    pillar: pillarResult.pillar,
    category: 'resolve_blocker',
    priority: 'low',
    title: `${pillarLabel}: ${blockerLabel}`,
    rationale: `${blockerLabel} identified as a barrier. Review whether this can be addressed.`,
    suggestedAction: `Review and address ${blockerLabel.toLowerCase()} if clinically appropriate.`,
    evidence: extractEvidence(pillarResult),
    cautions: extractCautions(pillarResult),
  }
}

function buildActionForUnknown(
  pillarResult: PillarResult,
): ActionItem {
  const pillarLabel = PILLAR_LABELS[pillarResult.pillar]
  return {
    id: `${pillarResult.pillar}-reassess`,
    pillar: pillarResult.pillar,
    category: 'reassess',
    priority: 'medium',
    title: `${pillarLabel}: Assessment needed`,
    rationale: 'Insufficient data to determine pillar status. Further assessment required.',
    suggestedAction: `Gather additional information to assess ${pillarLabel} status.`,
    evidence: extractEvidence(pillarResult),
    cautions: extractCautions(pillarResult),
  }
}

function buildActionsForPillar(
  pillarResult: PillarResult,
): ReadonlyArray<ActionItem> {
  if (pillarResult.status === 'ON_TARGET' || pillarResult.status === 'CONTRAINDICATED') {
    return []
  }

  if (pillarResult.status === 'UNKNOWN') {
    return [buildActionForUnknown(pillarResult)]
  }

  if (pillarResult.status === 'MISSING' && hasOnlyInertiaBlocker(pillarResult.blockers)) {
    return [buildActionForMissingNoBlocker(pillarResult)]
  }

  if (pillarResult.status === 'UNDERDOSED') {
    return [buildActionForUnderdosed(pillarResult)]
  }

  if (pillarResult.status === 'MISSING') {
    const realBlockers = pillarResult.blockers.filter(isRealBlocker)
    const actions: Array<ActionItem> = []
    const seenCategories = new Set<string>()

    for (const blocker of realBlockers) {
      const isLabBlocker = LAB_BLOCKERS.includes(blocker)
      const category: ActionCategory = isLabBlocker ? 'order_labs' : 'resolve_blocker'
      const categoryKey = `${pillarResult.pillar}-${category}`

      if (seenCategories.has(categoryKey)) {
        continue
      }
      seenCategories.add(categoryKey)

      if (isLabBlocker) {
        actions.push(buildActionForLabBlocker(pillarResult, blocker))
      } else {
        actions.push(buildActionForRealBlocker(pillarResult, blocker))
      }
    }

    return actions
  }

  return []
}

export function generateActionPlan(
  auditResult: AuditResult,
): ReadonlyArray<ActionItem> {
  const allActions: Array<ActionItem> = []

  for (const pillarResult of auditResult.pillarResults) {
    const actions = buildActionsForPillar(pillarResult)
    for (const action of actions) {
      allActions.push(action)
    }
  }

  const sorted = [...allActions].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )

  return sorted.slice(0, MAX_ACTIONS)
}
