import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRive, useStateMachineInput } from '@rive-app/react-canvas-lite'
import type { MascotEmotion } from '../types/mascot.ts'

// Mascot animation: "Little Fella" by selleslaghbert
// https://rive.app/community/files/17633-33058-little-fella/
// Licensed under CC BY 4.0

interface MascotProps {
  readonly emotion: MascotEmotion
  readonly isVisible: boolean
  readonly onHoverChange: (hovered: boolean) => void
  readonly onDismiss: () => void
}

const BUBBLE_DISPLAY_MS = 3000

const EMOTION_MESSAGE_KEYS = {
  IDLE: 'mascot.idle',
  THINKING: 'mascot.thinking',
  CELEBRATING: 'mascot.celebrating',
  CONCERNED: 'mascot.concerned',
  POINTING: 'mascot.pointing',
  HAPPY: 'mascot.happy',
} as const satisfies Readonly<Record<MascotEmotion, string>>

export function Mascot({ emotion, isVisible, onHoverChange, onDismiss }: MascotProps) {
  const { t } = useTranslation()
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleExiting, setBubbleExiting] = useState(false)
  const prevEmotionRef = useRef<MascotEmotion>(emotion)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { rive, RiveComponent } = useRive({
    src: '/mascot.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  })

  const isDistracted = useStateMachineInput(rive, 'State Machine 1', 'isDistracted')

  // Map emotion to Rive state machine inputs
  useEffect(() => {
    if (!isDistracted) return

    const shouldBeDistracted =
      emotion === 'THINKING' || emotion === 'CONCERNED' || emotion === 'POINTING'
    isDistracted.value = shouldBeDistracted
  }, [emotion, isDistracted])

  // Show speech bubble when emotion changes
  useEffect(() => {
    if (emotion === prevEmotionRef.current) return
    prevEmotionRef.current = emotion

    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current)
    }

    setBubbleExiting(false)
    setShowBubble(true)

    bubbleTimerRef.current = setTimeout(() => {
      setBubbleExiting(true)
      bubbleTimerRef.current = setTimeout(() => {
        setShowBubble(false)
        setBubbleExiting(false)
        bubbleTimerRef.current = null
      }, 300)
    }, BUBBLE_DISPLAY_MS)

    return () => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current)
      }
    }
  }, [emotion])

  const handleMouseEnter = useCallback(() => {
    onHoverChange(true)
  }, [onHoverChange])

  const handleMouseLeave = useCallback(() => {
    onHoverChange(false)
  }, [onHoverChange])

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-30 hidden md:block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showBubble && (
        <div
          className={`absolute -top-14 right-0 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 text-xs text-gray-600 max-w-[180px] whitespace-normal ${
            bubbleExiting ? 'mascot-bubble-exit' : 'mascot-bubble-enter'
          }`}
        >
          {t(EMOTION_MESSAGE_KEYS[emotion])}
          <div
            className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-white border-r border-b border-gray-200"
            aria-hidden="true"
          />
        </div>
      )}

      <div className="relative">
        <RiveComponent className="w-24 h-24 cursor-pointer" />
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('mascot.dismiss')}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300 transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100"
          style={{ opacity: undefined }}
          onFocus={(e) => { e.currentTarget.style.opacity = '1' }}
          onBlur={(e) => { e.currentTarget.style.opacity = '' }}
        >
          &times;
        </button>
      </div>
    </div>
  )
}
