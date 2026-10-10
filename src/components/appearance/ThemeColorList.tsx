import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import { THEME_COLOR_KEYS } from '@/schemas/themeSchemas'
import { appearanceTokenI18nKey } from '@/utils/appearanceTokens'
import type { ThemeColors } from '@/types/theme'

type Props = {
  colors: ThemeColors
  onEditToken: (token: keyof ThemeColors, current: string) => void
}

export default function ThemeColorList({ colors, onEditToken }: Props) {
  const { t } = useTranslation()

  return (
    <div className="theme-color-list mt-2 flex flex-col gap-1.5">
      {THEME_COLOR_KEYS.map((token) => (
        <Card key={token} className="!p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-normal text-[var(--color-text)]">
                {t(appearanceTokenI18nKey(token))}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--color-line)]"
                  style={{ backgroundColor: colors[token] }}
                  aria-hidden="true"
                />
                <span className="text-sm font-normal text-[var(--color-text-soft)]">{colors[token]}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditToken(token, colors[token])}
              className="shrink-0 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
            >
              {t('appearance.edit')}
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
