import { z } from 'zod'
import type { ThemeColors } from '@/types/theme'

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'invalidHex')

export const THEME_COLOR_KEYS = [
  '--color-text',
  '--color-text-strong',
  '--color-text-soft',
  '--color-surface',
  '--color-surface-top',
  '--color-surface-hover',
  '--color-line',
  '--color-line-strong',
  '--color-primary',
  '--color-on-primary',
  '--color-accent',
  '--color-accent-soft',
  '--color-success',
  '--color-success-soft',
  '--color-success-text',
  '--color-error',
  '--color-error-soft',
  '--color-error-text',
  '--color-warning',
  '--color-warning-soft',
  '--color-warning-text',
] as const satisfies readonly (keyof ThemeColors)[]

export const themeColorsSchema = z.object(
  Object.fromEntries(THEME_COLOR_KEYS.map((key) => [key, hexColorSchema])) as Record<
    keyof ThemeColors,
    typeof hexColorSchema
  >,
)

export const defaultLightTheme: ThemeColors = {
  '--color-text': '#1f1f1f',
  '--color-text-strong': '#0b0b0b',
  '--color-text-soft': '#6b6b6b',
  '--color-surface': '#ffffff',
  '--color-surface-top': '#f6f6f6',
  '--color-surface-hover': '#f0f0f0',
  '--color-line': '#e5e5e5',
  '--color-line-strong': '#d4d4d4',
  '--color-primary': '#0f766e',
  '--color-on-primary': '#ffffff',
  '--color-accent': '#14b8a6',
  '--color-accent-soft': '#ccfbf1',
  '--color-success': '#16a34a',
  '--color-success-soft': '#dcfce7',
  '--color-success-text': '#15803d',
  '--color-error': '#dc2626',
  '--color-error-soft': '#fee2e2',
  '--color-error-text': '#b91c1c',
  '--color-warning': '#d97706',
  '--color-warning-soft': '#fef3c7',
  '--color-warning-text': '#b45309',
}

export const defaultDarkTheme: ThemeColors = {
  '--color-text': '#e8e8e8',
  '--color-text-strong': '#ffffff',
  '--color-text-soft': '#a0a0a0',
  '--color-surface': '#161616',
  '--color-surface-top': '#0b0b0b',
  '--color-surface-hover': '#1f1f1f',
  '--color-line': '#2a2a2a',
  '--color-line-strong': '#3a3a3a',
  '--color-primary': '#5eead4',
  '--color-on-primary': '#0b0b0b',
  '--color-accent': '#2dd4bf',
  '--color-accent-soft': '#134e48',
  '--color-success': '#22c55e',
  '--color-success-soft': '#14532d',
  '--color-success-text': '#4ade80',
  '--color-error': '#f87171',
  '--color-error-soft': '#7f1d1d',
  '--color-error-text': '#fca5a5',
  '--color-warning': '#fbbf24',
  '--color-warning-soft': '#78350f',
  '--color-warning-text': '#fde68a',
}
