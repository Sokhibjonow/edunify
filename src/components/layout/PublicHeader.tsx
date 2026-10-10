import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/stores/themeStore'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import ThemeToggle from '@/components/layout/ThemeToggle'
import edunifyLogo from '@/assets/edunifyLogo.png'
import { hasSignup } from '@/routes/roles'
import type { Role } from '@/types/auth'
import type { AuthMode } from '@/components/auth/AuthModal'

type Props = { role: Role; onAuth: (mode: AuthMode) => void }

export default function PublicHeader({ role, onAuth }: Props) {
  const { t } = useTranslation()
  const theme = useThemeStore((s) => s.theme)
  const navigate = useNavigate()

  return (
    <header className="public-header flex items-center justify-between gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface-top)] px-3 py-2.5">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0"
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center ${
            theme === 'dark' ? 'invert' : ''
          }`}
        >
          <img src={edunifyLogo} alt="" className="h-full w-full object-contain" />
        </div>
        <span className="text-[15px] font-semibold text-[var(--color-text-strong)]">Edunify</span>
      </button>

      <div className="public-header-actions flex items-center gap-2.5">
        <LanguageSwitcher />
        <ThemeToggle />
        {hasSignup(role) && (
          <button
            type="button"
            onClick={() => onAuth('signup')}
            className="cursor-pointer rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-normal text-[var(--color-on-primary)]"
          >
            {t('auth.signUp')}
          </button>
        )}
        <button
          type="button"
          onClick={() => onAuth('login')}
          className="cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent px-2.5 py-1.5 text-sm font-normal text-[var(--color-text)]"
        >
          {t('auth.login')}
        </button>
      </div>
    </header>
  )
}
