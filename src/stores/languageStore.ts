import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/i18n'
import type { Language } from '@/types'

type LanguageState = {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang)
        set({ language: lang })
      },
    }),
    {
      name: 'language',
      onRehydrateStorage: () => (state) => {
        if (state) i18n.changeLanguage(state.language)
      },
    },
  ),
)