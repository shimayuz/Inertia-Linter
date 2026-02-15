import { useTranslation } from 'react-i18next'

interface MascotRestoreButtonProps {
  readonly onClick: () => void
}

export function MascotRestoreButton({ onClick }: MascotRestoreButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('mascot.restore')}
      className="fixed bottom-4 right-4 z-30 hidden md:flex w-9 h-9 rounded-full bg-teal-100 text-teal-600 items-center justify-center shadow-sm hover:bg-teal-200 hover:shadow-md transition-all duration-200"
    >
      <svg
        className="w-4.5 h-4.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
        />
      </svg>
    </button>
  )
}
