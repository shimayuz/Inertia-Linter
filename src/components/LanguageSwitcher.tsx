import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import { STORAGE_KEY } from '../i18n/index.ts'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
] as const

function storeLanguage(lang: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // localStorage unavailable
  }
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleSwitch = useCallback(
    (lang: string) => {
      void i18n.changeLanguage(lang)
      storeLanguage(lang)
      document.documentElement.lang = lang
    },
    [i18n],
  )

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Language">
      {LANGUAGES.map(({ code, label }) => {
        const isActive = i18n.language === code
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => handleSwitch(code)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
