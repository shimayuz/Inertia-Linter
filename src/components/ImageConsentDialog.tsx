import { useTranslation } from 'react-i18next'

const CONSENT_KEY = 'inertia-linter-image-consent'

interface ImageConsentDialogProps {
  readonly isOpen: boolean
  readonly onAccept: () => void
  readonly onDecline: () => void
}

export function hasImageConsent(): boolean {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function storeImageConsent(): void {
  try {
    sessionStorage.setItem(CONSENT_KEY, 'accepted')
  } catch {
    // sessionStorage unavailable, consent valid for this interaction only
  }
}

export function ImageConsentDialog({ isOpen, onAccept, onDecline }: ImageConsentDialogProps) {
  const { t } = useTranslation('safety')

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2
          id="consent-title"
          className="mb-4 text-lg font-bold text-red-700"
        >
          {t('consent.title')}
        </h2>
        <div className="mb-6 space-y-3 text-sm text-gray-700">
          <p>
            {t('consent.body1')}
          </p>
          <p className="font-semibold text-red-600">
            {t('consent.body2')}
          </p>
          <p>
            {t('consent.body3')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('consent.accept')}
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('consent.decline')}
          </button>
        </div>
      </div>
    </div>
  )
}
