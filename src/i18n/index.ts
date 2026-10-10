import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ru from './ru.json'
import uz from './uz.json'

const persisted = (() => {
  try {
    const raw = localStorage.getItem('language')
    if (!raw) return 'en'
    return JSON.parse(raw).state.language ?? 'en'
  } catch {
    return 'en'
  }
})()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uz: { translation: uz },
  },
  lng: persisted,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n