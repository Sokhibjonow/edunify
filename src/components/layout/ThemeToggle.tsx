import { Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/themeStore'

type Props = {
  label?: string
  className?: string
  role?: string
}

export default function ThemeToggle({ label, className = '', role }: Props) {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const isLight = theme === 'light'
  const isRow = !!label

  const icon = isLight ? (
    <Sun size={18} strokeWidth={1.8} className="text-[var(--color-text-strong)]" />
  ) : (
    <Moon size={18} strokeWidth={1.8} className="text-[var(--color-text-strong)]" />
  )

  return (
    <button
      type="button"
      role={role}
      onClick={toggleTheme}
      aria-label={isRow ? undefined : t('theme.toggle')}
      className={
        isRow
          ? `flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)] transition duration-150 ease-in-out hover:bg-[var(--color-surface-hover)] ${className}`
          : 'inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0'
      }
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}