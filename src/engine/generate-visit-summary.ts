import type { AuditResult } from '../types/audit.ts'
import type { ActionItem, ActionDecisionRecord } from '../types/action-plan.ts'

function formatDate(): string {
  return new Date().toISOString().split('T')[0]
}

function buildDecisionMap(
  decisions: ReadonlyArray<ActionDecisionRecord>,
): Readonly<Record<string, ActionDecisionRecord>> {
  const map: Record<string, ActionDecisionRecord> = {}
  for (const decision of decisions) {
    map[decision.actionId] = decision
  }
  return map
}

function formatActionItems(
  items: ReadonlyArray<ActionItem>,
  decisionMap: Readonly<Record<string, ActionDecisionRecord>>,
  includeReason: boolean,
): string {
  if (items.length === 0) {
    return '(none)'
  }

  return items
    .map((item) => {
      if (includeReason) {
        const decision = decisionMap[item.id]
        const reason = decision?.reason ?? 'No reason provided'
        return `- ${item.title} \u2014 ${reason}`
      }
      return `- ${item.title} \u2014 ${item.suggestedAction}`
    })
    .join('\n')
}

function formatPendingItems(
  items: ReadonlyArray<ActionItem>,
): string {
  if (items.length === 0) {
    return '(none)'
  }

  return items.map((item) => `- ${item.title}`).join('\n')
}

export function generateVisitSummary(
  auditResult: AuditResult,
  actions: ReadonlyArray<ActionItem>,
  decisions: ReadonlyArray<ActionDecisionRecord>,
): string {
  const decisionMap = buildDecisionMap(decisions)

  const addressNow: Array<ActionItem> = []
  const deferred: Array<ActionItem> = []
  const notApplicable: Array<ActionItem> = []
  const pending: Array<ActionItem> = []

  for (const action of actions) {
    const decision = decisionMap[action.id]
    if (!decision || decision.decision === 'undecided') {
      pending.push(action)
    } else if (decision.decision === 'address_now') {
      addressNow.push(action)
    } else if (decision.decision === 'defer') {
      deferred.push(action)
    } else if (decision.decision === 'not_applicable') {
      notApplicable.push(action)
    }
  }

  const { gdmtScore, efCategory } = auditResult

  return [
    'GDMT Optimization Visit Summary (DRAFT)',
    `Date: ${formatDate()} | EF Category: ${efCategory} | GDMT Score: ${String(gdmtScore.score)}/${String(gdmtScore.maxPossible)}`,
    '',
    'Actions Planned:',
    formatActionItems(addressNow, decisionMap, false),
    '',
    'Deferred:',
    formatActionItems(deferred, decisionMap, true),
    '',
    'Not Applicable:',
    formatActionItems(notApplicable, decisionMap, true),
    '',
    'Pending Review:',
    formatPendingItems(pending),
    '',
    '[DRAFT \u2014 Not a clinical document]',
  ].join('\n')
}
