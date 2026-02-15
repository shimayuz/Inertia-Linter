import { useTranslation } from 'react-i18next'

interface EHRConnectButtonProps {
  readonly onClick: () => void
  readonly dataSource: 'manual' | 'fhir' | 'vision'
}

export function EHRConnectButton({ onClick, dataSource }: EHRConnectButtonProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 px-4 py-2.5 text-sm font-medium text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-50/70"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M6.5 3.5C6.5 2.12 7.62 1 9 1s2.5 1.12 2.5 2.5S10.38 6 9 6c-.53 0-1.02-.17-1.42-.45L5.45 7.68c.28.4.45.89.45 1.42 0 .53-.17 1.02-.45 1.42l2.13 2.13c.4-.28.89-.45 1.42-.45 1.38 0 2.5 1.12 2.5 2.5S10.38 17 9 17s-2.5-1.12-2.5-2.5c0-.53.17-1.02.45-1.42L4.82 10.95c-.4.28-.89.45-1.42.45C2.02 11.4.9 10.28.9 8.9S2.02 6.4 3.4 6.4c.53 0 1.02.17 1.42.45l2.13-2.13C6.67 4.32 6.5 3.93 6.5 3.5z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
        {t('ehr.connect')}
        {dataSource === 'fhir' && (
          <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-600">
            FHIR R4
          </span>
        )}
      </button>
      {dataSource === 'fhir' && (
        <span className="text-[11px] text-teal-500">
          {t('ehr.dataLoaded')}
        </span>
      )}
    </div>
  )
}
