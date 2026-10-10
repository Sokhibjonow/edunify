import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PublicHeader from '@/components/layout/PublicHeader'
import AuthModal, { type AuthMode } from '@/components/auth/AuthModal'
import { useDocumentBranding } from '@/hooks/useDocumentBranding'
import { hasSignup } from '@/routes/roles'
import type { Role } from '@/types/auth'

type Props = { role: Role; i18nKey: string }

export default function RoleLanding({ role, i18nKey }: Props) {
  const { t } = useTranslation()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const signupEnabled = hasSignup(role)

  useDocumentBranding(
    authMode === 'login' ? t('auth.loginPageTitle') : t(`roles.${i18nKey}`),
  )

  return (
    <>
      <PublicHeader role={role} onAuth={(mode) => setAuthMode(mode)} />
      <main className="role-landing-page mx-auto max-w-sm p-3">
        <h1 className="text-[15px] font-semibold text-[var(--color-text-strong)]">
          {t(`roles.${i18nKey}`)}
        </h1>
        <p className="my-3 text-sm font-normal text-[var(--color-text-soft)]">
          {t('landing.subtitle')}
        </p>
        {signupEnabled && (
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className="w-full cursor-pointer rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-normal text-[var(--color-on-primary)]"
          >
            {t('auth.signUp')}
          </button>
        )}
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-normal ${
            signupEnabled
              ? 'mt-2 border border-[var(--color-line)] bg-transparent text-[var(--color-text)]'
              : 'border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
          }`}
        >
          {t('auth.login')}
        </button>
      </main>

      {authMode && (
        <AuthModal role={role} initialMode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </>
  )
}
