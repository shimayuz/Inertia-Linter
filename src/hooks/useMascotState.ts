import { useState, useMemo, useCallback } from 'react'
import type { AuditResult } from '../types/audit.ts'
import type { MascotEmotion } from '../types/mascot.ts'
import { deriveMascotEmotion } from '../engine/derive-mascot-emotion.ts'

interface MascotState {
  readonly emotion: MascotEmotion
  readonly isVisible: boolean
  readonly isHovered: boolean
  readonly setHovered: (hovered: boolean) => void
  readonly dismiss: () => void
  readonly restore: () => void
}

export function useMascotState(
  auditResult: AuditResult | null,
  isLoading: boolean,
  undecidedActionCount: number,
): MascotState {
  const [isVisible, setIsVisible] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const emotion = useMemo(
    () =>
      deriveMascotEmotion({
        auditResult,
        isLoading,
        isHovered,
        hasUndecidedActions: undecidedActionCount > 0,
      }),
    [auditResult, isLoading, isHovered, undecidedActionCount],
  )

  const dismiss = useCallback(() => setIsVisible(false), [])
  const restore = useCallback(() => setIsVisible(true), [])

  return {
    emotion,
    isVisible,
    isHovered,
    setHovered: setIsHovered,
    dismiss,
    restore,
  }
}
