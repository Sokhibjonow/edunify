import type { Theme } from '@/types'
import { defaultDarkTheme, defaultLightTheme } from '@/schemas/themeSchemas'
import { applyTheme, getCurrentThemeMode } from '@/theme'
import { useAuthStore } from '@/stores/authStore'

/** Applies branding for the given or current light/dark mode. */
export function syncAppliedTheme(mode: Theme = getCurrentThemeMode()) {
  const branding = useAuthStore.getState().organizationBranding
  applyTheme(
    mode,
    branding ?? { lightTheme: defaultLightTheme, darkTheme: defaultDarkTheme },
  )
}
