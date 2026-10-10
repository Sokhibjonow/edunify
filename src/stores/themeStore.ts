import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/types'
import { syncAppliedTheme } from '@/utils/syncTheme'

type ThemeState = {
  theme: Theme
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => {
          const next: Theme = state.theme === 'light' ? 'dark' : 'light'
          syncAppliedTheme(next)
          return { theme: next }
        }),
    }),
    {
      name: 'theme',
      onRehydrateStorage: () => (state) => {
        if (state) syncAppliedTheme(state.theme)
      },
    },
  ),
)

syncAppliedTheme(useThemeStore.getState().theme)
