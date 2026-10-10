import type { ThemeColors } from '@/types/theme'

export function appearanceTokenI18nKey(token: keyof ThemeColors): string {
  const slug = token.replace(/^--color-/, '').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  return `appearance.tokens.${slug}`
}
