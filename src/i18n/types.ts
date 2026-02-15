import type enUi from './locales/en/ui.json'
import type enClinical from './locales/en/clinical.json'
import type enSafety from './locales/en/safety.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui'
    resources: {
      ui: typeof enUi
      clinical: typeof enClinical
      safety: typeof enSafety
    }
  }
}
