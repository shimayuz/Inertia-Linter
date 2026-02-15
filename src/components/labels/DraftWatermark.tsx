import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface DraftWatermarkProps {
  readonly children: ReactNode
}

export function DraftWatermark({ children }: DraftWatermarkProps) {
  const { t } = useTranslation('safety')

  return (
    <div className="relative">
      {children}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      >
        <span className="text-4xl font-bold text-gray-400/20 -rotate-30 select-none whitespace-nowrap">
          {t('draft.watermark')}
        </span>
      </div>
    </div>
  )
}
