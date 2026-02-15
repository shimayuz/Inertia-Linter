import type { AuditResult } from '../types/audit.ts'
import type { MascotEmotion } from '../types/mascot.ts'
import { MASCOT_EMOTIONS } from '../types/mascot.ts'

interface DeriveMascotEmotionInput {
  readonly auditResult: AuditResult | null
  readonly isLoading: boolean
  readonly isHovered: boolean
  readonly hasUndecidedActions: boolean
}

export function deriveMascotEmotion(
  input: DeriveMascotEmotionInput,
): MascotEmotion {
  const { auditResult, isLoading, isHovered, hasUndecidedActions } = input

  // HAPPY overrides everything when hovered
  if (isHovered) {
    return MASCOT_EMOTIONS.HAPPY
  }

  // Show thinking emotion during loading
  if (isLoading) {
    return MASCOT_EMOTIONS.THINKING
  }

  // No audit result yet
  if (!auditResult) {
    return MASCOT_EMOTIONS.IDLE
  }

  // Determine emotion based on GDMT score performance
  const score = auditResult.gdmtScore.normalized
  const hasMissing = auditResult.pillarResults.some(
    (pillar) => pillar.status === 'MISSING',
  )

  // CELEBRATING for high scores overrides everything except HAPPY
  if (score > 70) {
    return MASCOT_EMOTIONS.CELEBRATING
  }

  // Show pointing if there are undecided actions (no MISSING pillars)
  if (hasUndecidedActions && !hasMissing) {
    return MASCOT_EMOTIONS.POINTING
  }

  // CONCERNED when any pillar is MISSING
  if (hasMissing) {
    return MASCOT_EMOTIONS.CONCERNED
  }

  // Default to IDLE for moderate scores
  return MASCOT_EMOTIONS.IDLE
}
