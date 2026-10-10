import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'
import { hasSignup, roleI18nKey } from '@/routes/roles'
import type { Role, SignupRole } from '@/types/auth'

export type AuthMode = 'login' | 'signup'

type Props = { role: Role; initialMode?: AuthMode; onClose: () => void }

export default function AuthModal({ role, initialMode = 'signup', onClose }: Props) {
  const { t } = useTranslation()
  const signupEnabled = hasSignup(role)
  const [mode, setMode] = useState<AuthMode>(signupEnabled ? initialMode : 'login')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const tabClass = (active: boolean) =>
    `flex-1 cursor-pointer rounded-lg px-2.5 py-1.5 text-sm transition duration-150 ease-in-out ${
      active
        ? 'bg-[var(--color-surface-hover)] font-semibold text-[var(--color-text-strong)]'
        : 'font-normal text-[var(--color-text-soft)]'
    }`

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
    >
      <div
        className="absolute inset-0 bg-[var(--color-text-strong)]/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="auth-modal relative w-full max-w-sm rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-top)] p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-[var(--color-text-strong)]">
            {t(`roles.${roleI18nKey(role)}`)}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0"
          >
            <X size={18} strokeWidth={1.8} className="text-[var(--color-text-soft)]" />
          </button>
        </div>

        {signupEnabled ? (
          <>
            <div className="flex gap-1.5 rounded-lg border border-[var(--color-line)] p-1">
              <button type="button" onClick={() => setMode('signup')} className={tabClass(mode === 'signup')}>
                {t('auth.signUp')}
              </button>
              <button type="button" onClick={() => setMode('login')} className={tabClass(mode === 'login')}>
                {t('auth.login')}
              </button>
            </div>

            <div className="mt-3 overflow-hidden">
              <div
                className={`flex w-[200%] transition-transform duration-300 ease-in-out ${
                  mode === 'login' ? '-translate-x-1/2' : ''
                }`}
              >
                <div className="w-1/2 pr-0.5" inert={mode !== 'signup'}>
                  <SignupForm role={role as SignupRole} />
                </div>
                <div className="w-1/2 pl-0.5" inert={mode !== 'login'}>
                  <LoginForm />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-1">
            <LoginForm />
          </div>
        )}
      </div>
    </div>
  )
}
