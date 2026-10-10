import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, LoaderCircle } from 'lucide-react'
import { useLoginMutation } from '@/hooks/useLoginMutation'
import { ApiError } from '@/services/api'

const fieldWrap = 'relative'
const iconClass =
  'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]'
const inputClass =
  'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-8 pr-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-line-strong)]'
const errorTextClass = 'text-sm font-normal text-[var(--color-error-text)]'

type FieldErrors = { email?: string; password?: string }

export default function LoginForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const mutation = useLoginMutation()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mutation.isPending) return

    const errors: FieldErrors = {}
    if (!email.trim()) errors.email = t('auth.required')
    if (!password) errors.password = t('auth.required')
    setFieldErrors(errors)
    if (errors.email || errors.password) return

    mutation.mutate({ email: email.trim(), password })
  }

  const formError = mutation.isError
    ? mutation.error instanceof ApiError && mutation.error.status === 401
      ? t('auth.invalidCredentials')
      : mutation.error instanceof ApiError && mutation.error.status === 403
        ? t('auth.accountNotActivated')
        : t('auth.genericError')
    : null

  return (
    <form onSubmit={handleSubmit} className="login-form flex flex-col gap-2">
      <div className={fieldWrap}>
        <Mail size={18} strokeWidth={1.8} className={iconClass} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.email')}
          aria-label={t('auth.email')}
          className={inputClass}
        />
      </div>
      {fieldErrors.email && <p className={errorTextClass}>{fieldErrors.email}</p>}

      <div className={fieldWrap}>
        <Lock size={18} strokeWidth={1.8} className={iconClass} />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.password')}
          aria-label={t('auth.password')}
          className={inputClass}
        />
      </div>
      {fieldErrors.password && <p className={errorTextClass}>{fieldErrors.password}</p>}

      {formError && <p className={errorTextClass}>{formError}</p>}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-normal text-[var(--color-on-primary)] disabled:cursor-default disabled:opacity-70"
      >
        {mutation.isPending ? (
          <LoaderCircle size={18} strokeWidth={1.8} className="animate-spin text-[var(--color-on-primary)]" />
        ) : (
          t('auth.login')
        )}
      </button>
    </form>
  )
}
