import { useTranslation } from 'react-i18next'
import ThemeColorList from '@/components/appearance/ThemeColorList'
import type { ThemeColors } from '@/types/theme'

type Props = {
  colors: ThemeColors
  onEditToken: (token: keyof ThemeColors, current: string) => void
}

export default function LightThemeSection({ colors, onEditToken }: Props) {
  const { t } = useTranslation()

  return (
    <section className="appearance-light-theme-section my-4">
      <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">
        {t('appearance.lightMode')}
      </h2>
      <ThemeColorList colors={colors} onEditToken={onEditToken} />
    </section>
  )
}
