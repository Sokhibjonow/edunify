import type { Theme } from '@/types'
import type { ThemeColors } from '@/types/theme'
import { THEME_COLOR_KEYS } from '@/schemas/themeSchemas'

export type ThemeSource = {
  lightTheme: ThemeColors
  darkTheme: ThemeColors
}

let currentMode: Theme = 'light'

export function getCurrentThemeMode(): Theme {
  return currentMode
}

export function applyTheme(mode: Theme, organization: ThemeSource) {
  if (typeof document === 'undefined') return
  currentMode = mode
  const root = document.documentElement
  const colors = mode === 'dark' ? organization.darkTheme : organization.lightTheme
  for (const key of THEME_COLOR_KEYS) {
    root.style.setProperty(key, colors[key])
  }
  root.setAttribute('data-theme', mode)
}
