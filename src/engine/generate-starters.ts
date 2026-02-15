import type { AuditResult } from '../types/audit.ts'
import type { ConversationStarter } from '../types/chat.ts'
import { PILLAR_LABELS } from '../types/pillar.ts'

const MAX_STARTERS = 4

const CATEGORY_PRIORITY: Readonly<Record<ConversationStarter['category'], number>> = {
  gap: 0,
  blocker: 1,
  opportunity: 2,
}

function isRealBlocker(code: string): boolean {
  return code !== 'CLINICAL_INERTIA'
}

export function generateConversationStarters(
  auditResult: AuditResult,
): ReadonlyArray<ConversationStarter> {
  const starters: Array<ConversationStarter> = []

  for (const pillarResult of auditResult.pillarResults) {
    const pillarLabel = PILLAR_LABELS[pillarResult.pillar]

    if (pillarResult.status === 'ON_TARGET' || pillarResult.status === 'CONTRAINDICATED') {
      continue
    }

    const realBlockers = pillarResult.blockers.filter(isRealBlocker)
    const hasOnlyClinicalInertia =
      pillarResult.blockers.length > 0 &&
      realBlockers.length === 0

    if (pillarResult.status === 'MISSING' && hasOnlyClinicalInertia) {
      starters.push({
        label: `Why isn't ${pillarLabel} prescribed?`,
        prompt: `The audit shows ${pillarLabel} is not prescribed for this patient with ${auditResult.efCategory} and no identified contraindication. What evidence supports initiating this therapy?`,
        category: 'gap',
      })
    } else if (pillarResult.status === 'UNDERDOSED') {
      starters.push({
        label: `Uptitration of ${pillarLabel}?`,
        prompt: `The audit shows ${pillarLabel} is below target dose. What are the considerations for uptitration?`,
        category: 'opportunity',
      })

      for (const blocker of realBlockers) {
        starters.push({
          label: `Explain ${blocker} for ${pillarLabel}`,
          prompt: `The audit identified ${blocker} as a barrier for ${pillarLabel}. Can you explain this in context of current guidelines?`,
          category: 'blocker',
        })
      }
    } else if (realBlockers.length > 0) {
      for (const blocker of realBlockers) {
        starters.push({
          label: `Explain ${blocker} for ${pillarLabel}`,
          prompt: `The audit identified ${blocker} as a barrier for ${pillarLabel}. Can you explain this in context of current guidelines?`,
          category: 'blocker',
        })
      }
    }
  }

  const sorted = [...starters].sort(
    (a, b) => CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category],
  )

  return sorted.slice(0, MAX_STARTERS)
}
