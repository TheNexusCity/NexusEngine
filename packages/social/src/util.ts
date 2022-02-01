import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { getI18nConfigs as getClientCoreI18nConfigs } from '@xrengine/client-core/src/i18n'
import { setRuntime } from '@xrengine/common/src/config'
import translation from '../i18n/en/translation.json'

export const initialize = (): Promise<void> => {
  return new Promise((resolve) => {
    // Set Runtime config to client core
    setRuntime(
      process.env.APP_ENV === 'development' ? process.env.publicRuntimeConfig : (window as any).env.publicRuntimeConfig
    )
    delete process.env.publicRuntimeConfig

    // Setup I18N
    const resources = {
      en: {
        translation
      }
    }

    const namespace = ['translation']

    const subPackageTranslations = [getClientCoreI18nConfigs()]

    for (let t of subPackageTranslations) {
      for (let key of Object.keys(t.resources)) {
        if (!resources[key]) resources[key] = t.resources[key]
        else resources[key] = { ...resources[key], ...t.resources[key] }
      }

      for (let ns of t.namespace) {
        if (!namespace.includes(ns)) namespace.push(ns)
      }
    }

    i18n.use(LanguageDetector).use(initReactI18next).init({
      fallbackLng: 'en',
      ns: namespace,
      defaultNS: 'translation',
      lng: 'en',
      resources
    })

    resolve()
  })
}
