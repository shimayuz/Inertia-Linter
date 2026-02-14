import type { ReactNode } from 'react'

interface DraftWatermarkProps {
  readonly children: ReactNode
}

export function DraftWatermark({ children }: DraftWatermarkProps) {
  return (
    <div className="relative">
      {children}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      >
        <span className="text-4xl font-bold text-gray-400/20 -rotate-30 select-none whitespace-nowrap">
          DRAFT — Pending physician review
        </span>
      </div>
    </div>
  )
}
