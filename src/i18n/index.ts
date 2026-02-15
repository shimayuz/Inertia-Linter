import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enUi from './locales/en/ui.json'
import enClinical from './locales/en/clinical.json'
import enSafety from './locales/en/safety.json'
import jaUi from './locales/ja/ui.json'
import jaClinical from './locales/ja/clinical.json'
import jaSafety from './locales/ja/safety.json'

const STORAGE_KEY = 'inertia-linter-lang'

function getStoredLanguage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'en'
  } catch {
    return 'en'
  }
}

const resources = {
  en: {
    ui: enUi,
    clinical: enClinical,
    safety: enSafety,
  },
  ja: {
    ui: jaUi,
    clinical: jaClinical,
    safety: jaSafety,
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  defaultNS: 'ui',
  ns: ['ui', 'clinical', 'safety'],
  interpolation: {
    escapeValue: false,
  },
})

export { STORAGE_KEY }
export default i18n
