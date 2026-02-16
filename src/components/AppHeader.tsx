import { useTranslation } from 'react-i18next'
import { DemoModeBadge } from './DemoModeBadge'
import { LanguageSwitcher } from './LanguageSwitcher'

interface AppHeaderProps {
  readonly isSidebarOpen: boolean
  readonly onToggleSidebar: () => void
}

function HeartbeatIcon() {
  return (
    <svg
      className="w-5 h-5 text-teal-600"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  )
}

export function AppHeader({ isSidebarOpen, onToggleSidebar }: AppHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-12">
      <div className="flex items-center justify-between px-5 h-full max-w-[1920px] mx-auto">
        {/* Left: Logo + App Name + Version */}
        <div className="flex items-center gap-2">
          <HeartbeatIcon />
          <span className="font-bold text-slate-800">{t('nav.appName')}</span>
          <span className="bg-slate-100 text-slate-500 text-xs rounded px-1.5 py-0.5">
            v2.4
          </span>
        </div>

        {/* Center: Tab Navigation */}
        <nav className="flex items-center gap-6">
          {/* Patients — toggle sidebar (leftmost) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={
              isSidebarOpen
                ? 'text-teal-700 border-b-2 border-teal-700 font-semibold pb-0.5 transition-colors'
                : 'text-gray-500 hover:text-teal-600 font-medium pb-0.5 transition-colors'
            }
            aria-pressed={isSidebarOpen}
          >
            {t('nav.patients')}
          </button>

          {/* Dashboard — always active, static */}
          <span className="text-teal-700 border-b-2 border-teal-700 font-semibold pb-0.5">
            {t('nav.dashboard')}
          </span>

          {/* Reports — coming soon */}
          <span
            className="text-gray-400 cursor-not-allowed pb-0.5"
            title={t('nav.comingSoon')}
            aria-disabled
          >
            {t('nav.reports')}
          </span>
        </nav>

        {/* Right: DemoModeBadge + LanguageSwitcher */}
        <div className="flex items-center gap-3">
          <DemoModeBadge />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
